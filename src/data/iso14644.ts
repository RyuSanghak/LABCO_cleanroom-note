/**
 * ISO 14644-1:2015 Table 1 — 등급별 최대 허용 농도 (particles/m³).
 * null 은 표준에서 해당 구간에 농도 한계를 정하지 않은 칸(각주 c·d·e)이다.
 *   - 작은 등급 + 큰 입자: 입자 수가 너무 적어 통계적으로 분류에 부적합(d, e)
 *   - 큰 등급 + 작은 입자: 농도가 너무 높아 적용하지 않음(c)
 * 공식 (참고용): Cn = 10^N × (0.1 / D)^2.08 — 표준은 유효숫자 3자리로 반올림한 표 값을 쓴다.
 * 각주 g: ISO Class 9 는 운전 중(in operation) 상태에만 적용된다.
 * 검증: 2026-11-01, 각주 a~g 를 포함한 2차 출처 2곳 이상과 대조.
 */
export const SIZES = [0.1, 0.2, 0.3, 0.5, 1, 5] as const;
export type Size = (typeof SIZES)[number];

export const CLASS_LIMITS: Record<number, Record<Size, number | null>> = {
  1: { 0.1: 10, 0.2: null, 0.3: null, 0.5: null, 1: null, 5: null },
  2: { 0.1: 100, 0.2: 24, 0.3: 10, 0.5: null, 1: null, 5: null },
  3: { 0.1: 1000, 0.2: 237, 0.3: 102, 0.5: 35, 1: null, 5: null },
  4: { 0.1: 10000, 0.2: 2370, 0.3: 1020, 0.5: 352, 1: 83, 5: null },
  5: { 0.1: 100000, 0.2: 23700, 0.3: 10200, 0.5: 3520, 1: 832, 5: null },
  6: { 0.1: 1000000, 0.2: 237000, 0.3: 102000, 0.5: 35200, 1: 8320, 5: 293 },
  7: { 0.1: null, 0.2: null, 0.3: null, 0.5: 352000, 1: 83200, 5: 2930 },
  8: { 0.1: null, 0.2: null, 0.3: null, 0.5: 3520000, 1: 832000, 5: 29300 },
  9: { 0.1: null, 0.2: null, 0.3: null, 0.5: 35200000, 1: 8320000, 5: 293000 },
};

/**
 * ISO 14644-1:2015 Annex A Table A.1 — 면적(m²) 이하 → 최소 샘플링 위치 수 NL.
 * 1,000 m² 초과: 식 (A.1) NL = 27 × (A / 1000), 올림. (예: 2,000 m² → 54곳)
 * 검증: 2026-11-01, 27행 전체를 2차 출처 3곳과 대조.
 */
export const SAMPLING_LOCATIONS: [number, number][] = [
  [2, 1], [4, 2], [6, 3], [8, 4], [10, 5], [24, 6], [28, 7], [32, 8], [36, 9],
  [52, 10], [56, 11], [64, 12], [68, 13], [72, 14], [76, 15], [104, 16], [108, 17],
  [116, 18], [148, 19], [156, 20], [192, 21], [232, 22], [276, 23], [352, 24],
  [436, 25], [636, 26], [1000, 27],
];

/** FED-STD-209E(폐지) 와 ISO 등급 대응. 0.5 µm 기준. */
export const FED_209E = [
  { fed: 'Class 1', iso: 'ISO 3', perFt3: 1, perM3: 35 },
  { fed: 'Class 10', iso: 'ISO 4', perFt3: 10, perM3: 352 },
  { fed: 'Class 100', iso: 'ISO 5', perFt3: 100, perM3: 3520 },
  { fed: 'Class 1,000', iso: 'ISO 6', perFt3: 1000, perM3: 35200 },
  { fed: 'Class 10,000', iso: 'ISO 7', perFt3: 10000, perM3: 352000 },
  { fed: 'Class 100,000', iso: 'ISO 8', perFt3: 100000, perM3: 3520000 },
];

/**
 * EU GMP Annex 1 (2022) Table 1 — 등급별 최대 허용 총입자 농도 (particles/m³).
 * 출처: European Commission, Annex 1 "Manufacture of Sterile Medicinal Products" (2022-08-22), 4.27 Table 1.
 *  - null = 표에서 "Not specified"(각주 a: CCS 또는 이력 추세가 요구하면 5 µm 분류를 고려할 수 있음)
 *  - 'NP' = "Not predetermined"(각주 b: Grade D 운전 중 한계는 제조사가 위험평가·운전 데이터로 설정)
 * ISO 대응은 Annex 1 본문에 표로 적힌 것이 아니라 0.5 µm 한계값이 ISO 14644-1 Table 1 과 같은 값인 등급을 적은 참고 정보.
 */
export const GMP_GRADES = [
  { grade: 'A', atRest05: 3520, atRest5: null, inOp05: 3520, inOp5: null, isoAtRest: 'ISO 5', isoInOp: 'ISO 5' },
  { grade: 'B', atRest05: 3520, atRest5: null, inOp05: 352000, inOp5: 2930, isoAtRest: 'ISO 5', isoInOp: 'ISO 7' },
  { grade: 'C', atRest05: 352000, atRest5: 2930, inOp05: 3520000, inOp5: 29300, isoAtRest: 'ISO 7', isoInOp: 'ISO 8' },
  { grade: 'D', atRest05: 3520000, atRest5: 29300, inOp05: 'NP', inOp5: 'NP', isoAtRest: 'ISO 8', isoInOp: '—' },
] as const;

export const FT3_PER_M3 = 35.3147; // 1 m³ = 35.3147 ft³
export const LPM_PER_CFM = 28.3168; // 1 CFM = 28.3168 L/min
