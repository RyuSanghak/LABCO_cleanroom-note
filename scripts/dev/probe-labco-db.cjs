// 랩코 DB 읽기 전용 확인 스크립트. 테이블 목록, 컬럼, 최신 2행, 데이터 기간만 출력한다. 값을 바꾸는 명령은 없다.
// 실행: node scripts/probe-labco-db.cjs
const fs = require('fs');
const mysql = require('C:/Users/rkr77/Downloads/LABCO_server/node_modules/mysql2/promise');

const envText = fs.readFileSync('C:/Users/rkr77/Downloads/LABCO_server/.env', 'utf8');
const env = Object.fromEntries(
  envText.split(/\r?\n/).filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  }),
);

(async () => {
  const c = await mysql.createConnection({
    host: env.DB_HOST, user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME, port: 3306, connectTimeout: 10000,
  });
  const [tables] = await c.query('SHOW TABLES');
  const names = tables.map((r) => Object.values(r)[0]);
  console.log('tables:', names.length, 'DATA_* tables:', names.filter((n) => n.startsWith('DATA_')).length);
  console.log('first 8:', names.slice(0, 8).join(', '));
  const [cols] = await c.query('SHOW COLUMNS FROM `DATA_2021_LAB1ST_1074`');
  console.log('columns:', cols.map((x) => `${x.Field}(${x.Type})`).join(', '));
  const [rows] = await c.query('SELECT * FROM `DATA_2021_LAB1ST_1074` ORDER BY idx DESC LIMIT 2');
  console.log('latest rows:', JSON.stringify(rows));
  const [cnt] = await c.query('SELECT COUNT(*) AS n, MIN(inputDate) AS first, MAX(inputDate) AS last FROM `DATA_2021_LAB1ST_1074`');
  console.log('count/range:', JSON.stringify(cnt[0]));
  await c.end();
})().catch((e) => { console.error('ERROR:', e.code || e.message); process.exit(1); });
