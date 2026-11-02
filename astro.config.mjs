// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';

// 배포 주소. Cloudflare Pages 환경 변수 SITE_URL 로 덮어쓸 수 있다.
const site = process.env.SITE_URL ?? 'https://cleanroomnote.com';

export default defineConfig({
  site,
  integrations: [sitemap()],
  build: { format: 'directory' },
  // 기본 GFM 은 물결표 하나(~)도 취소선으로 해석해 "6~8" 같은 범위 표기가 깨진다.
  // GFM 을 직접 넣고 singleTilde 를 끈다. 취소선은 ~~두 개~~ 로만.
  markdown: { gfm: false, remarkPlugins: [[remarkGfm, { singleTilde: false }]] },
});
