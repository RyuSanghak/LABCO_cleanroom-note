// 사이트 전역 설정. 이름·도메인은 임시이며 확정되면 여기만 바꾸면 된다.
export const SITE = {
  name: '클린룸 노트',
  tagline: '클린룸·입자 측정 실무 지식과 계산기',
  description:
    'ISO 14644-1 청정도 등급 계산기, 샘플링 위치 수 계산기, 파티클 카운터 원리와 GMP 환경 모니터링까지. 클린룸과 입자 측정 실무자를 위한 한국어 지식 포털.',
  operator: '개인 운영 (랩코 주주)',
  contactEmail: '', // 확정 후 입력. 비어 있으면 문의 안내만 표시.
  labcoUrl: 'http://www.labco.co.kr', // 랩코 공식 홈페이지
};

export const NAV = [
  { href: '/', label: '메인' },
  { href: '/tools/', label: '계산기' },
  { href: '/map/', label: '지도' },
  { href: '/articles/', label: '지식' },
  { href: '/labco/', label: '랩코 제품' },
  { href: '/about/', label: '소개' },
];
