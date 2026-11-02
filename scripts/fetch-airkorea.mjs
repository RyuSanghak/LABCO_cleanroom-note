// 전국 미세먼지 지도 데이터 수집 → public/data/airkorea.json
//  1) 에어코리아 공공 API: 시도별 실시간 측정정보 (sidoName=전국, 호출 1회) + 측정소 위치 (하루 1회 캐시)
//     이용허락 공공누리 제3유형 (출처 표시, 변경 금지) — 값과 등급은 API 가 준 그대로 저장.
//  2) 랩코 측정망: 앱 서버 /api/devices (장비별 최신 PM10·PM2.5, 위치). 주소는 LABCO_API_URL 환경 변수.
//     품질 기준: 3시간 이상 끊긴 장비·값 0·비현실적 값은 제외하고, 등급은 에어코리아 1시간 등급과 같은 기준으로 계산.
// 키: 환경 변수 AIRKOREA_KEY (로컬 .env, GitHub Actions 는 Secrets). URL 인코딩된 키 그대로 사용.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';

const BASE = 'https://apis.data.go.kr/B552584';
// 랩코 측정망 API 주소는 공개 저장소에 노출하지 않도록 환경 변수(.env / GitHub Secrets)로만 받는다. 없으면 랩코 데이터는 건너뛴다.
const LABCO_API = () => process.env.LABCO_API_URL || '';
const OUT_DIR = new URL('../public/data/', import.meta.url);
const STATIONS = new URL('stations.json', OUT_DIR);
const OUT = new URL('airkorea.json', OUT_DIR);

// .env 의 값을 process.env 에 없는 키만 채운다 (로컬용). GitHub Actions 는 Secrets 로 바로 들어온다.
try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(String.fromCharCode(10))) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}
function loadKey() {
  if (!process.env.AIRKOREA_KEY) throw new Error('AIRKOREA_KEY 가 없습니다 (.env 또는 환경 변수)');
  return process.env.AIRKOREA_KEY;
}

async function call(service, op, params) {
  const qs = Object.entries({ returnType: 'json', numOfRows: 1000, pageNo: 1, ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${BASE}/${service}/${op}?serviceKey=${loadKey()}&${qs}`, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${op} HTTP ${res.status}`);
  const json = await res.json();
  const header = json?.response?.header;
  if (header?.resultCode !== '00') throw new Error(`${op} ${header?.resultCode} ${header?.resultMsg}`);
  return json.response.body;
}

// 측정소 위치: 캐시가 STATIONS_MAX_AGE_HOURS(기본 24) 보다 새로우면 재사용.
async function loadStations() {
  const maxAgeH = Number(process.env.STATIONS_MAX_AGE_HOURS ?? 24);
  if (existsSync(STATIONS) && Date.now() - statSync(STATIONS).mtimeMs < maxAgeH * 3600 * 1000) {
    return JSON.parse(readFileSync(STATIONS, 'utf8'));
  }
  const body = await call('MsrstnInfoInqireSvc', 'getMsrstnList', {});
  const list = body.items
    .map((s) => ({ name: s.stationName, lat: Number(s.dmX), lng: Number(s.dmY), addr: s.addr, mang: s.mangName }))
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(STATIONS, JSON.stringify(list));
  console.log(`stations: ${list.length}`);
  return list;
}

const num = (v) => (v === null || v === undefined || v === '' || v === '-' ? null : Number(v));

// 에어코리아 1시간 등급과 같은 구간 (PM10 30/80/150, PM2.5 15/35/75)
const gradePm10 = (v) => (v == null ? null : v <= 30 ? 1 : v <= 80 ? 2 : v <= 150 ? 3 : 4);
const gradePm25 = (v) => (v == null ? null : v <= 15 ? 1 : v <= 35 ? 2 : v <= 75 ? 3 : 4);

// 랩코 데이터의 시도명을 에어코리아 표기에 맞춘다 (2026년 행정구역 통합: 광주·전남 → 전남광주).
const SIDO_ALIAS = { 광주: '전남광주', 전남: '전남광주', 광주광역시: '전남광주', 전라남도: '전남광주' };
const normSido = (s) => SIDO_ALIAS[s] ?? s;

async function fetchAirkorea() {
  const stations = await loadStations();
  const byName = new Map();
  for (const s of stations) byName.set(s.name, [...(byName.get(s.name) ?? []), s]);
  const body = await call('ArpltnInforInqireSvc', 'getCtprvnRltmMesureDnsty', { sidoName: '전국', ver: '1.3' });
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
  console.log(`airkorea: ${rows.length} stations`);
  return rows;
}

async function fetchLabco() {
  if (!LABCO_API()) { console.log('labco: skipped (LABCO_API_URL 미설정)'); return []; }
  try {
    const res = await fetch(LABCO_API(), { signal: AbortSignal.timeout(30000) });
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
      rows.push({
        n: d.dong, s: normSido(d.city), lat: Number(d.lat), lng: Number(d.lng), t: new Date(t).toISOString(),
        pm10, pm25, g10: gradePm10(pm10), g25: gradePm25(pm25),
      });
    }
    console.log(`labco: ${devices.length} devices → ${rows.length} shown (stale ${stale}, empty ${empty}, outlier ${outlier})`);
    return rows;
  } catch (e) {
    console.log(`labco: skipped (${e.message})`);
    return [];
  }
}

const [airkorea, labco] = await Promise.all([fetchAirkorea(), fetchLabco()]);
const dataTime = airkorea.map((r) => r.t).filter(Boolean).sort().at(-1) ?? null;
const out = {
  updated: new Date().toISOString(), dataTime,
  sources: { airkorea: '한국환경공단 에어코리아', labco: '랩코(LABCO) 측정망' },
  airkorea, labco,
};
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(out));
console.log(`written: airkorea ${airkorea.length}, labco ${labco.length}, dataTime ${dataTime}`);
