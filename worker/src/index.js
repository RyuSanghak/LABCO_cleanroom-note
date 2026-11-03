/**
 * 클린룸 노트 데이터 수집 Worker
 *  - Cron(매시간 7분)으로 에어코리아 전국 실시간 측정값 + 랩코 측정망을 받아 KV 에 저장한다.
 *  - GET /airkorea.json 으로 저장된 JSON 을 제공한다 (CORS 허용, 5분 캐시).
 *  - GET /refresh?token=<REFRESH_TOKEN> 으로 즉시 갱신할 수 있다 (운영 routine 용).
 * 비밀값(wrangler secret): AIRKOREA_KEY, LABCO_API_URL(없으면 랩코 생략), REFRESH_TOKEN.
 * KV 바인딩: DATA. 키: airkorea(결과), stations(측정소 위치 캐시, 24h).
 * 데이터 규칙은 scripts/fetch-airkorea.mjs 와 같다 (공공누리 제3유형: 값·등급은 API 가 준 그대로).
 */
const BASE = 'https://apis.data.go.kr/B552584';
const STATIONS_TTL_MS = 24 * 3600 * 1000;

const num = (v) => (v === null || v === undefined || v === '' || v === '-' ? null : Number(v));
const gradePm10 = (v) => (v == null ? null : v <= 30 ? 1 : v <= 80 ? 2 : v <= 150 ? 3 : 4);
const gradePm25 = (v) => (v == null ? null : v <= 15 ? 1 : v <= 35 ? 2 : v <= 75 ? 3 : 4);
const SIDO_ALIAS = { 광주: '전남광주', 전남: '전남광주', 광주광역시: '전남광주', 전라남도: '전남광주' };
const normSido = (s) => SIDO_ALIAS[s] ?? s;

async function call(env, service, op, params) {
  const qs = Object.entries({ returnType: 'json', numOfRows: 1000, pageNo: 1, ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${BASE}/${service}/${op}?serviceKey=${env.AIRKOREA_KEY}&${qs}`, { signal: AbortSignal.timeout(45000) });
  if (!res.ok) throw new Error(`${op} HTTP ${res.status}`);
  const json = await res.json();
  const header = json?.response?.header;
  if (header?.resultCode !== '00') throw new Error(`${op} ${header?.resultCode} ${header?.resultMsg}`);
  return json.response.body;
}

async function loadStations(env) {
  const cached = await env.DATA.get('stations', 'json');
  if (cached && Date.now() - cached.at < STATIONS_TTL_MS) return cached.list;
  const body = await call(env, 'MsrstnInfoInqireSvc', 'getMsrstnList', {});
  const list = body.items
    .map((s) => ({ name: s.stationName, lat: Number(s.dmX), lng: Number(s.dmY), addr: s.addr, mang: s.mangName }))
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
  await env.DATA.put('stations', JSON.stringify({ at: Date.now(), list }));
  return list;
}

async function fetchAirkorea(env) {
  const stations = await loadStations(env);
  const byName = new Map();
  for (const s of stations) byName.set(s.name, [...(byName.get(s.name) ?? []), s]);
  const body = await call(env, 'ArpltnInforInqireSvc', 'getCtprvnRltmMesureDnsty', { sidoName: '전국', ver: '1.3' });
  const rows = [];
  for (const it of body.items ?? []) {
    const cands = byName.get(it.stationName) ?? [];
    const sidoKey = it.sidoName.replace(/(특별|광역|자치)?(시|도)$/, '');
    const st = cands.length === 1 ? cands[0] : cands.find((c) => c.addr?.startsWith(sidoKey)) ?? cands[0];
    if (!st) continue;
    rows.push({
      n: it.stationName, s: it.sidoName, lat: st.lat, lng: st.lng, m: it.mangName, t: it.dataTime,
      pm10: num(it.pm10Value), pm25: num(it.pm25Value), g10: num(it.pm10Grade1h), g25: num(it.pm25Grade1h),
      khai: num(it.khaiValue), gk: num(it.khaiGrade),
    });
  }
  return rows;
}

async function fetchLabco(env) {
  if (!env.LABCO_API_URL) return { rows: [], note: 'LABCO_API_URL 미설정' };
  try {
    const res = await fetch(env.LABCO_API_URL, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const devices = await res.json();
    const now = Date.now();
    const rows = [];
    let stale = 0, empty = 0, outlier = 0;
    for (const d of devices) {
      const t = new Date(d.inputDate).getTime();
      const pm10 = Number(d.pm10), pm25 = Number(d.pm25);
      if (!Number.isFinite(t) || now - t > 3 * 3600 * 1000) { stale++; continue; }
      if (!(pm10 > 0) || !(pm25 > 0)) { empty++; continue; }
      if (pm10 > 1000 || pm25 > 500 || pm25 > pm10 * 1.5) { outlier++; continue; }
      rows.push({ n: d.dong, s: normSido(d.city), lat: Number(d.lat), lng: Number(d.lng), t: new Date(t).toISOString(), pm10, pm25, g10: gradePm10(pm10), g25: gradePm25(pm25) });
    }
    return { rows, note: `${devices.length}대 중 ${rows.length} 표시 (끊김 ${stale}, 값없음 ${empty}, 이상값 ${outlier})` };
  } catch (e) {
    // Workers 는 비표준 포트(예: 3000)로 접속하지 못한다. 그럴 때는 GitHub Actions 가 올려 둔 수집본에서 랩코 데이터만 가져온다.
    try {
      const res = await fetch('https://raw.githubusercontent.com/RyuSanghak/LABCO_cleanroom-note/data/airkorea/airkorea.json', { signal: AbortSignal.timeout(20000), cf: { cacheTtl: 0 } });
      if (!res.ok) throw new Error(`fallback HTTP ${res.status}`);
      const d = await res.json();
      const age = Math.round((Date.now() - new Date(d.updated).getTime()) / 60000);
      return { rows: d.labco ?? [], note: `직접 접속 실패(${e.message}) → GitHub 수집본 사용 (${age}분 전, ${(d.labco ?? []).length}대)` };
    } catch (e2) {
      return { rows: [], note: `랩코 실패: ${e.message}; 대체 경로도 실패: ${e2.message}` };
    }
  }
}

async function refresh(env) {
  const prev = await env.DATA.get('airkorea', 'json');
  let airkorea, labco;
  try {
    airkorea = await fetchAirkorea(env);
  } catch (e) {
    // 에어코리아가 실패하면 이전 데이터를 유지하고 실패만 기록한다.
    const out = { ...(prev ?? { airkorea: [], labco: [] }), lastError: `${new Date().toISOString()} ${e.message}` };
    await env.DATA.put('airkorea', JSON.stringify(out));
    return out;
  }
  labco = await fetchLabco(env);
  const dataTime = airkorea.map((r) => r.t).filter(Boolean).sort().at(-1) ?? null;
  const out = {
    updated: new Date().toISOString(), dataTime,
    sources: { airkorea: '한국환경공단 에어코리아', labco: '랩코(LABCO) 측정망' },
    airkorea, labco: labco.rows, labcoNote: labco.note,
  };
  await env.DATA.put('airkorea', JSON.stringify(out));
  return out;
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' };

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refresh(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/airkorea.json' || url.pathname === '/') {
      const body = await env.DATA.get('airkorea');
      if (!body) return new Response('{"error":"no data yet"}', { status: 503, headers: { ...CORS, 'Content-Type': 'application/json' } });
      return new Response(body, { headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
    }
    if (url.pathname === '/refresh') {
      if (!env.REFRESH_TOKEN || url.searchParams.get('token') !== env.REFRESH_TOKEN) return new Response('forbidden', { status: 403 });
      const out = await refresh(env);
      return new Response(JSON.stringify({ updated: out.updated, dataTime: out.dataTime, airkorea: out.airkorea.length, labco: out.labco.length, labcoNote: out.labcoNote, lastError: out.lastError ?? null }), { headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });
    }
    if (url.pathname === '/health') {
      const d = await env.DATA.get('airkorea', 'json');
      const ageMin = d?.updated ? Math.round((Date.now() - new Date(d.updated).getTime()) / 60000) : null;
      return new Response(JSON.stringify({ ok: ageMin !== null && ageMin < 180, ageMinutes: ageMin, airkorea: d?.airkorea?.length ?? 0, labco: d?.labco?.length ?? 0, lastError: d?.lastError ?? null }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    return new Response('not found', { status: 404 });
  },
};
