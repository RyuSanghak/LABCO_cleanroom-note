// 랩코 DB 2차 확인 (읽기 전용): 메타 테이블 후보, PM 단위 추정용 통계, 살아 있는 장비 수.
// 실행: node scripts/dev/probe-labco-db2.cjs
const fs = require('fs');
const mysql = require('C:/Users/rkr77/Downloads/LABCO_server/node_modules/mysql2/promise');

const env = Object.fromEntries(
  fs.readFileSync('C:/Users/rkr77/Downloads/LABCO_server/.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  }),
);

(async () => {
  const c = await mysql.createConnection({ host: env.DB_HOST, user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME, port: 3306, connectTimeout: 10000 });

  // 1. DATA_ 가 아닌 테이블 (장비 목록·위치 메타가 있을 후보)
  const [tables] = await c.query('SHOW TABLES');
  const names = tables.map((r) => Object.values(r)[0]);
  const meta = names.filter((n) => !/^(AZBK_)?DATA_/.test(n));
  console.log('non-DATA tables:', meta.length);
  console.log(meta.join(', '));
  for (const t of meta.slice(0, 12)) {
    const [cols] = await c.query(`SHOW COLUMNS FROM \`${t}\``);
    const [cnt] = await c.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
    console.log(`  - ${t} (${cnt[0].n} rows): ${cols.map((x) => x.Field).join(', ')}`);
  }

  // 2. PM 단위 추정: 앱에 쓰던 11대의 최근 7일 통계
  const eleven = ['DATA_2021_LAB1ST_1074', 'DATA_2021_LAB1ST_1195', 'DATA_2021_LAB1ST_1381', 'DATA_2021_LAB1ST_1255', 'DATA_2021_LAB1ST_1365',
    'DATA_2021_LAB1ST_1379', 'DATA_2021_LAB1ST_1301', 'DATA_2021_LAB1ST_1256', 'DATA_2021_LAB2ND_1662', 'DATA_2021_LAB1ST_1465', 'DATA_2021_LAB2ND_1344'];
  console.log('\n7-day stats (table, rows, PM10 min/avg/max, PM25 min/avg/max, same PM10=PM25 ratio, last):');
  for (const t of eleven) {
    try {
      const [s] = await c.query(
        `SELECT COUNT(*) n, MIN(PM10) p10min, AVG(PM10) p10avg, MAX(PM10) p10max, MIN(PM25) p25min, AVG(PM25) p25avg, MAX(PM25) p25max,
                AVG(PM10 = PM25) same, MAX(inputdate) last FROM \`${t}\` WHERE inputdate >= NOW() - INTERVAL 7 DAY`);
      const r = s[0];
      const f = (v) => (v === null ? '-' : Number(v).toPrecision(4));
      console.log(`  ${t}: ${r.n} rows, PM10 ${f(r.p10min)}/${f(r.p10avg)}/${f(r.p10max)}, PM25 ${f(r.p25min)}/${f(r.p25avg)}/${f(r.p25max)}, same=${f(r.same)}, last=${r.last}`);
    } catch (e) { console.log(`  ${t}: ERROR ${e.code || e.message}`); }
  }

  // 3. 전체 DATA_ 테이블 중 최근 24시간 안에 데이터가 들어온 장비 수 (information_schema 의 갱신 시각 사용, 빠름)
  const [upd] = await c.query(
    `SELECT COUNT(*) total, SUM(UPDATE_TIME >= NOW() - INTERVAL 1 DAY) live1d, SUM(UPDATE_TIME >= NOW() - INTERVAL 30 DAY) live30d
     FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'DATA\\_%'`, [env.DB_NAME]);
  console.log('\nDATA_ tables:', JSON.stringify(upd[0]));
  await c.end();
})().catch((e) => { console.error('ERROR:', e.code || e.message); process.exit(1); });
