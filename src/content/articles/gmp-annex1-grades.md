---
title: "EU GMP Annex 1 (2022) Grade A·B·C·D 와 ISO 등급: 총입자 한계와 모니터링 요구사항"
short: "GMP Annex 1 Grade A~D 와 ISO 등급"
description: "2022년 개정 EU GMP Annex 1 Table 1 의 Grade A~D 총입자 한계, ISO 14644-1 대응, 5 µm 'Not specified' 의 의미, 입자 모니터링 요구사항."
pubDate: 2026-11-01
tags: ["GMP", "Annex 1", "제약 클린룸", "환경 모니터링"]
---

제약 무균 제조의 청정 등급 **Grade A/B/C/D** 는 EU GMP Annex 1 이 정합니다. KGMP·PIC/S 도 같은 체계입니다. 현행판은 2022년 8월 공표, 2023년 8월 시행.

## 네 등급

- **A**: 충전 지점 등 고위험 작업 구역. 층류 작업대, RABS, 아이솔레이터 안.
- **B**: Grade A 의 배경 환경.
- **C, D**: 덜 중요한 단계, 최종 멸균 제품 공정.

## Table 1 — 분류 한계 (개/m³)

| Grade | ≥0.5 µm at rest | ≥0.5 µm in operation | ≥5 µm at rest | ≥5 µm in operation |
|---|---:|---:|---:|---:|
| A | 3,520 | 3,520 | Not specified (a) | Not specified (a) |
| B | 3,520 | 352,000 | Not specified (a) | 2,930 |
| C | 352,000 | 3,520,000 | 2,930 | 29,300 |
| D | 3,520,000 | Not predetermined (b) | 29,300 | Not predetermined (b) |

- **(a)**: 오염관리전략(CCS)이나 이력 추세가 요구하면 5 µm 분류를 고려할 수 있음. 의무 아님.
- **(b)**: Grade D 운전 중 한계는 제조사가 위험평가·운전 데이터로 설정.

### Grade A 의 5 µm 가 "Not specified" 인 이유

2008년판은 20개/m³ 였지만, 깨끗한 공기에서 5 µm 20개는 통계적으로 신뢰성 있게 세기 어렵습니다. ISO 14644-1:2015 도 ISO 5 의 5 µm 한계를 삭제했고, 2022년판이 이를 따랐습니다. 단, **모니터링에서는 5 µm 를 계속 봅니다**(아래).

## ISO 대응 (0.5 µm 한계값 기준, 참고)

| Grade | at rest | in operation |
|---|---|---|
| A | ISO 5 | ISO 5 |
| B | ISO 5 | ISO 7 |
| C | ISO 7 | ISO 8 |
| D | ISO 8 | 제조사 설정 |

분류 측정의 위치 수·샘플 부피는 ISO 14644-1 을 따르고, Grade A/B 는 핵심 공정 위치를 추가합니다. → [샘플링 계산기](/tools/sampling-locations/)

## 입자 모니터링 요구사항 (요약)

- Grade A: 핵심 작업 전체 기간 **상시** 모니터링, 셋업 중에도.
- Grade B: 유사한 체계, 빈도는 위험평가로 조정.
- **0.5 µm 와 5 µm 모두** 측정. 5 µm 가 낮은 수준이라도 연속·반복되면 오염 신호로 보고 조사.
- 샘플링 튜브는 짧게(1 m 안팎). 큰 입자 손실 때문.
- 알람 한계(alert/action)는 분류 한계와 별도로 추세 데이터로 설정.
- 재분류 주기: Grade A/B 최대 6개월, C/D 최대 12개월.

그래서 제약 현장의 표준 구성은 **지점별 네트워크형 2채널(0.5/5.0 µm) 카운터 + 중앙 소프트웨어 + 알람**입니다.

> 참고: European Commission, EudraLex Vol. 4, Annex 1 (2022-08-22) 4.27~4.29, 9장. 표 수치는 공식 PDF 원문 대조. 확인 2026-11-01.
