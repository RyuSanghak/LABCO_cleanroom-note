# 클린룸 노트 (cleanroom-portal)

클린룸·입자 측정 실무자를 위한 한국어 지식 포털 + 계산기 사이트. 정적 사이트(Astro)이며 서버가 없다.
수익 모델은 Google AdSense 광고 + 랩코(LABCO) 제품 문의 유도. 이름과 도메인은 임시다(`src/site.ts` 한 곳에서 바꾼다).

## 구성

```
src/
  site.ts                 사이트 이름·설명·메뉴·연락처 (한 곳에서 관리)
  data/iso14644.ts        ISO 14644-1 Table 1, Table A.1, FED-209E, GMP Annex 1 수치 (출처·검증일 주석)
  layouts/Base.astro      공통 레이아웃 (메타·OG·JSON-LD·애드센스 로더·헤더·푸터)
  components/AdSlot.astro 광고 자리 (PUBLIC_ADSENSE_CLIENT 없으면 배포에서 출력 안 함)
  components/LabcoCta.astro 랩코 제품 안내 배너
  content/articles/*.md   지식 글 (frontmatter: title, description, pubDate, updatedDate?, tags, draft)
  pages/                  index, about, privacy, tools/*, articles/*, labco/
  components/HeroDashboard.astro 메인 히어로: 파티클 카운터 허브 구성 예시 화면 (업종 탭·이벤트 연출, 가상 데이터)
scripts/fetch-airkorea.mjs  전국 미세먼지 데이터 수집 (에어코리아 + 랩코 측정망)
scripts/check-links.mjs   빌드 결과의 내부 링크 검사
scripts/dev/              랩코 DB 확인용 읽기 전용 스크립트 (로컬 전용, LABCO_server 폴더 필요)
docs/logo-brief.md        로고 디자인 브리프 + AI 프롬프트
.github/workflows/check.yml    push/PR 빌드+링크 검사, 6시간마다 라이브 점검(실패 시 incident 이슈)
.github/workflows/airkorea.yml 수동 데이터 수집 → data 브랜치 (보조, 상시 수집은 worker/)
worker/                   Cloudflare Worker: 매시간 수집 → KV → data.cleanroomnote.com (상시 수집 주체)
```

## 디자인

"측정 장비의 계기판" 컨셉. 서체 IBM Plex Sans KR + IBM Plex Mono(숫자), 파란 기운의 중립색, 액센트 파랑 1색, 계산 결과는 네이비 계기판(.result).
토큰은 `src/styles/global.css` 맨 위 `:root` 에 있고 다크 모드는 같은 토큰을 재정의한다. 등급색(좋음·보통·나쁨·매우나쁨)은 의미색이라 액센트와 별개.

## 로컬 개발

```bash
npm install
npm run dev              # http://localhost:4321
npm run fetch:airkorea   # public/data/airkorea.json 갱신 (.env 의 AIRKOREA_KEY 필요)
npm run check            # 빌드 + 내부 링크 검사
```

Node 22 이상. 로컬 Node 가 22.13 이라 Astro 5 계열에 고정했다(Astro 7 은 Node 22.23+ 필요).

## 배포 체크리스트

1. GitHub 저장소 생성 후 push (`main`).
2. 저장소 Settings → Secrets: `AIRKOREA_KEY`, `LABCO_API_URL`(보조 워크플로용). Variables: `SITE_URL`.
3. `worker/README.md` 대로 데이터 Worker 를 배포한다.
4. Cloudflare Pages 연결(아래), 환경 변수 `SITE_URL` 입력.
5. 도메인 연결 후 `public/robots.txt` 의 Sitemap 주소와 `.env.example` 의 SITE_URL 을 실제 도메인으로 교체.
6. `src/site.ts` 의 `contactEmail` 입력. 사이트 이름 확정 시 `SITE.name` 교체.
7. 글 10편 이상 확인됨 → 애드센스 신청. 승인 후 `PUBLIC_ADSENSE_CLIENT`, `public/ads.txt`.

## 배포 (Cloudflare Pages, 무료)

1. GitHub 에 이 저장소를 올린다.
2. Cloudflare 대시보드 → Workers & Pages → Create → Pages → Connect to Git → 저장소 선택.
3. 빌드 설정: Framework preset **Astro**, Build command `npm run build`, Output directory `dist`.
4. 환경 변수: `SITE_URL=https://<실제 도메인>` (sitemap·canonical 용), 승인 후 `PUBLIC_ADSENSE_CLIENT=ca-pub-...`.
5. 커스텀 도메인 연결 후 `public/robots.txt` 의 Sitemap 주소를 실제 도메인으로 바꾼다.

이후에는 `main` 에 push 할 때마다 자동 배포된다.

## 운영 자동화

- **빌드·링크 검사**: push/PR 마다 GitHub Actions 가 실행. 깨지면 PR 이 빨간불.
- **라이브 점검**: 6시간마다 `vars.SITE_URL` 로 홈·계산기·sitemap 응답을 확인하고, 실패하면 `incident` 라벨 이슈를 연다(이미 열려 있으면 중복 생성 안 함).
  저장소 Settings → Secrets and variables → Actions → Variables 에 `SITE_URL` 을 넣어야 동작한다.
- **외부 모니터링(선택)**: UptimeRobot 등에 홈 URL 을 5분 간격으로 등록해 알림을 받는다.
- **자동 수정 루프(예정)**: `incident` 이슈가 열리면 클라우드 routine(Claude, Opus) 이 원인 분석 후 수정 PR 을 만들고, 사람이 머지한다.

## 전국 미세먼지 지도 (`/map/`)

- 데이터 두 가지를 한 지도에 그린다.
  - **공식 측정소**: 한국환경공단 에어코리아 공공 API (공공누리 제3유형: 출처 표시, 변경 금지). 값·등급은 API 가 준 그대로.
  - **랩코 측정망**: 서비스 중인 앱 서버의 `/api/devices` (장비별 최신 PM10·PM2.5). 주소는 `.env`/Secrets 의 `LABCO_API_URL`. 품질 기준: 3시간 이상 끊김·값 0·비현실적 값(PM10>1000, PM2.5>500, PM2.5>PM10×1.5)은 제외, 등급은 에어코리아 1시간 등급과 같은 구간으로 계산, 시도명은 에어코리아 표기(전남광주 등)로 통일.
- 로컬 수집(개발용): `node scripts/fetch-airkorea.mjs` → `public/data/airkorea.json` (+ 측정소 위치 캐시 `stations.json`, 하루 1회 갱신). 키는 `.env` 의 `AIRKOREA_KEY`.
- 운영(주): **Cloudflare Worker** `worker/` 가 매시간 7분 Cron 으로 수집해 KV 에 저장하고 `https://data.cleanroomnote.com/airkorea.json` 으로 제공한다. 사이트는 이 주소를 코드에 고정해 읽는다. 상태는 `/health`, 즉시 갱신은 `/refresh?token=…`. 배포·비밀값은 `worker/README.md`.
  Workers 는 IP 직접 접속과 비표준 포트를 허용하지 않아, 랩코 서버는 nginx 로 80 포트를 열고(`/api/` 만 3000 으로 프록시) DNS 레코드 `labco-api.cleanroomnote.com`(DNS only) 으로 접속한다. 직접 접속이 실패하면 이전 수집분을 유지하고 `labcoNote` 에 기록한다.
- 보조: `.github/workflows/airkorea.yml` 은 수동 실행(workflow_dispatch) 전용으로 남겨 두었다. 실행하면 `data` 브랜치 `airkorea/airkorea.json` 에 커밋한다.
- 지도: Leaflet(cdnjs) + OpenStreetMap. PM2.5/PM10 전환, 시도 선택(해당 지역으로 이동), 측정소 검색, 등급별 요약, 줌 11 이상에서 값 표시, 공식/랩코 레이어 켜고 끄기.
- API 호출량: 시간당 1회 + 측정소 목록 하루 1회 ≈ 하루 25회 (개발계정 한도 500회). 사이트 공개 후 운영계정 신청 권장.

## 애드센스 준비 순서

1. 글 10편 이상, 소개·개인정보처리방침 페이지(있음), 자체 도메인.
2. 애드센스 가입 → 사이트 추가 → 발급된 `ca-pub-...` 를 `PUBLIC_ADSENSE_CLIENT` 환경 변수에 넣고 재배포.
   (`Base.astro` 가 로더 스크립트를, `AdSlot` 이 광고 유닛을 자동으로 넣는다.)
3. 승인 후 `public/ads.txt` 를 애드센스가 안내하는 내용으로 추가한다.
4. 자동 광고를 쓰면 AdSlot 은 비워 두어도 된다.

## 콘텐츠 원칙

- 수치는 표준 원문 구조와 공식 문서를 따르고, 2차 출처 2곳 이상과 교차 확인한 뒤 글 끝에 확인 날짜를 적는다.
- `src/data/iso14644.ts` 의 수치를 바꿀 때는 주석의 출처와 검증일도 함께 갱신한다.
- 랩코 제품 사양은 공식 사이트(labco.co.kr) 기준이며 `labco/index.astro` 상단의 `checked` 날짜를 갱신한다.
- 계산 결과는 참고용임을 각 계산기 하단 notice 에 명시한다.

## 검증 기록 (2026-11-01)

| 항목 | 출처 | 결과 |
|---|---|---|
| ISO 14644-1:2015 Table 1 (각주 a~g 포함) | 2차 출처 3곳 교차 | 일치. 1999년판 값(2·4·8·29) 삭제 확인 |
| ISO 14644-1:2015 Table A.1 (27행) + 식 A.1 | 2차 출처 3곳 교차, 2,000 m² → 54곳 예시 | 일치 |
| EU GMP Annex 1 (2022) Table 1 | 유럽위원회 공식 PDF 원문 | Grade A/B at rest 5 µm 는 "Not specified" (초안의 29 → 수정) |
| 국내 미세먼지 예보등급 | 에어코리아 공개 페이지 | PM10 0-30/31-80/81-150/150초과, PM2.5 0-15/16-35/36-75/75초과 |
| 랩코 제품·연혁·연락처 | labco.co.kr 공식 페이지 | 반영. "20대 관리" 문구는 사용자 지시로 제외 |
| ISO 21501-4 허용 기준 | 교정기관·제조사 자료 복수 | 계수효율 50±20%/100±10%, 크기 설정 ≤10%, 분해능 ≤15%, 유량 ≤5%, 주기 ≤1년 |
| ISO 14644-2:2015 모니터링 계획 | 2차 출처 복수 | 고정 주기표 삭제, 연 1회 기본·위험평가 연장 확인 |
| Annex 1 (2022) 차압·clean-up·튜브 | 공식 PDF 원문 | 최소 10 Pa(guidance), clean-up < 20분(guidance), 튜브 ≤ 1 m |
| ISO 14644-4 차압 범위 | 2차 출처 복수 | 5~20 Pa |
| 간이측정기 성능인증 | 한국환경공단 안내 PDF | 2022-07-25 개정으로 1등급/등급외 2단계, 항목별 80%·R² 0.8, 수수료 4,271,000원 |
| EPA PM2.5 AQI 구간 (2024) | EPA 공식 팩트시트 PDF | 0~9.0 / 9.1~35.4 / 35.5~55.4 / 55.5~125.4 / 125.5~225.4 / 225.5+ |

## 저작권

© 2026 클린룸 노트. All rights reserved. 글·계산기·디자인의 무단 복제와 재배포를 금합니다. 표준·공공 데이터의 수치는 각 출처의 이용 조건을 따릅니다.
