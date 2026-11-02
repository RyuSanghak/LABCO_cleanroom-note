# 로고 디자인 브리프 — 클린룸 노트

> 사이트 이름은 임시입니다. 이름이 확정되면 이 문서의 이름만 바꿔 전달하세요.
> 아래 "AI 프롬프트" 섹션은 Midjourney·DALL·E·Ideogram 같은 도구에 그대로 넣을 수 있게 영문으로 적었습니다.

## 1. 무엇을 위한 로고인가

- **서비스**: 클린룸·입자 측정 실무자를 위한 한국어 웹사이트. ISO 14644-1 등급 계산기, 샘플링 계산기, 전국 미세먼지 실시간 지도, 측정 원리·규정 해설 글.
- **사용자**: 반도체·디스플레이·제약(GMP)·식품 공장의 클린룸 담당자, 환경 측정 업무자, 파티클 카운터를 고르는 사람.
- **인상**: 정확함, 깨끗함, 신뢰. 장난스럽거나 화려하지 않게. 측정 장비 제조사(랩코)와 나란히 놓여도 어색하지 않은 산업·기술 톤.
- **쓰임새**: 웹사이트 헤더(높이 28~32px), 브라우저 탭 아이콘(16·32px), 소셜 미리보기 이미지, 나중에 명함·문서.

## 2. 핵심 개념 (이 중 하나 또는 조합)

1. **입자(particle)**: 크기가 다른 원 2~3개. 파티클 카운터가 세는 0.3·0.5·5 µm 입자, 미세먼지 PM10·PM2.5.
2. **광산란(light scattering)**: 가는 빛줄기를 지나는 입자 하나, 거기서 퍼지는 빛. 파티클 카운터의 측정 원리.
3. **격자/클린룸**: 정돈된 격자(HEPA 필터 천장, 샘플링 위치 분할)와 그 안의 점 하나.
4. **노트**: 이름의 "노트"를 살린 메모·기록의 느낌(모서리, 줄). 1~3번 개념과 결합.

피할 것: 마스크·바이러스·의료 십자(의료 느낌), 지구본·나뭇잎(환경 캠페인 느낌), 공장 굴뚝, 복잡한 장비 일러스트, 그라데이션 과다.

## 3. 색과 서체

- **주색**: 파랑 `#0B63C4` (사이트 액센트). 다크 모드용 밝은 파랑 `#5AA2F0`.
- **보조**: 거의 검정 `#1A1D23`, 연한 파랑 배경 `#E6F0FB`, 흰색.
- 로고는 **단색(파랑 1색, 검정 1색, 흰색 반전)** 으로도 성립해야 함.
- 서체: 기하학적이고 획이 고른 산세리프. 한글 "클린룸 노트" 와 영문 표기(확정 시 전달)가 같은 무게로 보이게.

## 4. 납품물

- 심볼 단독 / 심볼+워드마크 가로형 / 세로형, 각각 컬러·검정·흰색 반전
- 파비콘용 단순화 버전 (16px 에서도 형태가 살아야 함)
- SVG(벡터) + PNG(투명 배경, 512·1024px), 가능하면 원본 작업 파일
- 최소 여백·최소 크기 규칙 한 장

## 5. AI 이미지 생성용 프롬프트 (영문)

**기본 (입자 개념)**

```
Minimal flat vector logo for "Cleanroom Note", a Korean technical website about cleanroom particle measurement.
Symbol: three circles of different sizes (large, medium, tiny) arranged on a thin horizontal beam of light, suggesting particles passing a laser in a particle counter.
Style: geometric, precise, single color royal blue (#0B63C4) on white, no gradients, no shadows, no text, generous negative space, works as a 16px favicon.
Mood: scientific, clean, trustworthy, industrial-tech. Not medical, not eco-campaign.
```

**변형 A (격자·클린룸)**

```
Minimal geometric logo mark: a 3x3 grid of thin rounded squares like a HEPA ceiling or sampling-location grid, with a single solid dot in one cell. Flat vector, one color royal blue #0B63C4 on white, no text, no gradient, crisp at small sizes. Scientific, calm, precise.
```

**변형 B (광산란)**

```
Abstract logo mark of light scattering: one small solid circle at the center, thin radiating lines of light to the right, a thin horizontal beam entering from the left. Flat vector, single color deep blue, white background, no text, balanced and symmetrical enough to use as an app icon.
```

**워드마크 포함**

```
Logo lockup: the symbol on the left, the wordmark "클린룸 노트" on the right in a clean geometric Korean sans-serif, medium weight, dark charcoal #1A1D23. Horizontal layout, flat vector, white background.
```

네거티브 프롬프트(지원하는 도구용): `gradient, 3d, glossy, realistic, photo, medical cross, virus, globe, leaf, factory, chimney, complex illustration, text artifacts, mockup`

## 6. 전달 시 함께 보낼 것

- 사이트 화면 캡처 2~3장 (메인, 지도, 계산기) — 로고가 놓일 자리와 톤 확인용
- 랩코(LABCO) 로고 — 함께 노출될 수 있으니 충돌 피하기 위해 참고용
