# 커밋 기록을 깨끗한 커밋 하나로 합치고 force-push 한다.
# 목적: 초기 커밋에 남아 있던 랩코 서버 주소를 기록에서 제거한 뒤 저장소를 공개로 전환하기 위해.
# 실행 (PowerShell):  powershell -ExecutionPolicy Bypass -File scripts\dev\squash-history.ps1
# 주의: 되돌릴 수 없는 작업이다. 이 저장소에는 다른 사람의 커밋이 없고, 작업 트리는 현재 상태 그대로 보존된다.

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\..")

git checkout --orphan fresh
git add -A
git -c core.safecrlf=false commit -q -m @"
클린룸 노트 초기 버전

- Astro 5 정적 사이트: 계산기 3종(ISO 등급·샘플링·단위 변환), 지식 글 10편, 랩코 제품 페이지
- 전국 미세먼지 지도: 에어코리아 공식 측정소 + 랩코 측정망, 매시간 수집 워크플로(data 브랜치)
- 메인 히어로: 파티클 카운터 허브 구성 예시(업종 탭·이벤트 연출)
- 디자인 토큰: IBM Plex Sans KR/Mono, 계기판 스타일 결과 패널, 다크 모드
- GitHub Actions: 빌드·링크 검사, 6시간 라이브 점검, 시간별 데이터 수집

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
"@
git branch -D main
git branch -m main
git push -f origin main

Write-Host ""
Write-Host "기록에 남은 서버 주소 수 (0 이어야 함):" (git log --all -p | Select-String -Pattern "52\.79\.50" | Measure-Object).Count
git log --oneline
