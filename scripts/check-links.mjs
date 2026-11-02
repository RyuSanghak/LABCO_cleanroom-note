// 빌드 결과(dist)의 내부 링크가 전부 실제 파일을 가리키는지 확인한다.
// 사용: node scripts/check-links.mjs dist
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (name.endsWith('.html')) yield p;
  }
}

// "/tools/iso-class/" → dist/tools/iso-class/index.html 또는 dist/tools/iso-class.html 또는 파일 그대로
function targetExists(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return existsSync(join(root, 'index.html'));
  const rel = clean.replace(/^\//, '');
  return (
    existsSync(join(root, rel)) ||
    existsSync(join(root, rel, 'index.html')) ||
    existsSync(join(root, rel.replace(/\/$/, '') + '.html'))
  );
}

let pages = 0;
const broken = [];
for (const file of htmlFiles(root)) {
  pages++;
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const href = m[1];
    if (href.startsWith('//')) continue; // 프로토콜 상대 외부 링크
    if (!targetExists(href)) broken.push(`${file.replace(root, '')} → ${href}`);
  }
}

console.log(`checked ${pages} pages`);
if (broken.length) {
  console.error(`broken internal links (${broken.length}):`);
  for (const b of broken) console.error('  ' + b);
  process.exit(1);
}
console.log('no broken internal links');
