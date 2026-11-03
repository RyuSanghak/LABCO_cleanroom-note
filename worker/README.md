# 데이터 수집 Worker

사이트의 전국 미세먼지 데이터를 매시간 받아 제공하는 Cloudflare Worker. GitHub Actions 예약 실행이 불안정해 이쪽으로 옮겼다.

- 주소: `https://data.cleanroomnote.com/airkorea.json` (사이트가 읽는 파일), `/health` (상태), `/refresh?token=…` (즉시 갱신)
- 예약: 매시간 7분 (Cron Trigger). 에어코리아 API 호출 하루 25회 수준.
- 저장: KV `DATA` (키 `airkorea`, `stations`). 에어코리아가 실패하면 이전 데이터를 유지하고 `lastError` 만 기록.

## 처음 배포

```bash
cd worker
npx wrangler login                                   # 브라우저에서 Cloudflare 승인 (1회)
npx wrangler kv namespace create DATA                # 출력된 id 를 wrangler.toml 의 KV_NAMESPACE_ID 자리에 넣는다
npx wrangler secret put AIRKOREA_KEY                 # 에어코리아 인증키 (URL 인코딩된 키 그대로)
npx wrangler secret put LABCO_API_URL                # 랩코 앱 서버 /api/devices 주소
npx wrangler secret put REFRESH_TOKEN                # 아무 긴 임의 문자열
npx wrangler deploy
```

배포 직후에는 데이터가 비어 있으니 `/refresh?token=…` 을 한 번 호출하거나 다음 정시 7분을 기다린다.

## 확인

```bash
curl https://data.cleanroomnote.com/health
```
