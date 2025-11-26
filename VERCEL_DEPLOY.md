# Vercel 배포 가이드

## 1. Vercel 계정 생성
1. https://vercel.com/signup 접속
2. GitHub 계정으로 로그인 (권장)
3. 계정 생성 완료

## 2. 프로젝트 배포
1. Vercel 대시보드에서 "Add New Project" 클릭
2. GitHub 저장소 선택: `velzo-by-lake/velzo-smps`
3. 프로젝트 설정:
   - **Framework Preset**: Vite (자동 감지됨)
   - **Build Command**: `npm run build` (자동 설정됨)
   - **Output Directory**: `dist` (자동 설정됨)
   - **Install Command**: `npm install` (자동 설정됨)

## 3. 환경 변수 설정
프로젝트 설정에서 "Environment Variables" 섹션으로 이동하여 다음 변수 추가:

- `VITE_TELEGRAM_BOT_TOKEN`: 텔레그램 봇 토큰
- `VITE_TELEGRAM_CHAT_ID`: 텔레그램 채팅 ID

## 4. 배포 완료
- 배포가 완료되면 자동으로 URL이 생성됩니다
- 예: `https://velzo-smps.vercel.app`
- 커스텀 도메인도 설정 가능합니다

## 5. 자동 배포
- GitHub의 `main` 브랜치에 push하면 자동으로 배포됩니다
- Pull Request 생성 시 프리뷰 배포도 자동으로 생성됩니다

## 참고사항
- Vercel은 무료 플랜에서도 충분히 사용 가능합니다
- GitHub와 연동하면 토큰 문제 없이 자동 배포가 가능합니다
- `vercel.json` 파일이 이미 설정되어 있어 자동으로 인식됩니다

