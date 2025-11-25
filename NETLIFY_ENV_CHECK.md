# Netlify 환경 변수 설정 확인 가이드

## 문제: "텔레그램 봇 설정이 필요합니다" 경고가 나타나는 경우

이 경고는 Netlify 배포 환경에서 환경 변수가 제대로 로드되지 않았을 때 나타납니다.

## 해결 방법

### 1. Netlify 환경 변수 확인

1. Netlify 대시보드에 로그인합니다.
2. 프로젝트를 선택합니다.
3. **Site settings** → **Environment variables**로 이동합니다.
4. 다음 변수들이 정확히 설정되어 있는지 확인합니다:
   - `VITE_TELEGRAM_BOT_TOKEN` - 봇 토큰 (예: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
   - `VITE_TELEGRAM_CHAT_ID` - Chat ID (예: `123456789` 또는 `-5017123136`)

### 2. 환경 변수 값 확인

- **토큰 형식**: 숫자와 콜론(:)이 포함되어야 합니다. 예: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
- **Chat ID**: 숫자 또는 음수일 수 있습니다. 예: `123456789` 또는 `-5017123136`
- **공백 없음**: 값 앞뒤에 공백이 없어야 합니다.

### 3. 재배포 필수

⚠️ **중요**: 환경 변수를 추가하거나 수정한 후에는 **반드시 재배포**해야 합니다!

#### 재배포 방법:

**방법 1: 수동 재배포**
1. Netlify 대시보드 → **Deploys** 탭
2. **Trigger deploy** → **Clear cache and deploy site** 클릭

**방법 2: Git Push로 자동 배포**
```bash
git commit --allow-empty -m "trigger: 재배포 (환경 변수 적용)"
git push origin main
```

### 4. 브라우저 콘솔에서 확인

배포 후 브라우저 개발자 도구(F12) → Console 탭에서:

1. **정상 작동 시**: 경고 메시지가 없어야 합니다.
2. **문제가 있을 시**: 다음과 같은 디버깅 정보가 표시됩니다:
   ```
   텔레그램 봇 설정이 필요합니다. {
     hasToken: false,
     hasChatId: false,
     tokenLength: 0,
     chatIdLength: 0,
     envKeys: []
   }
   ```

### 5. 환경 변수가 로드되지 않는 경우

#### 가능한 원인:

1. **환경 변수 이름 오타**
   - 정확한 이름: `VITE_TELEGRAM_BOT_TOKEN` (대소문자 구분)
   - 정확한 이름: `VITE_TELEGRAM_CHAT_ID` (대소문자 구분)

2. **VITE_ 접두사 누락**
   - Vite 프로젝트에서는 환경 변수에 `VITE_` 접두사가 필요합니다.
   - ❌ 잘못된 예: `TELEGRAM_BOT_TOKEN`
   - ✅ 올바른 예: `VITE_TELEGRAM_BOT_TOKEN`

3. **재배포 미실행**
   - 환경 변수는 빌드 타임에 주입되므로, 설정 후 재배포가 필수입니다.

4. **캐시 문제**
   - **Clear cache and deploy site** 옵션을 사용하여 재배포하세요.

### 6. 로컬 개발 환경 확인

로컬에서 테스트하려면 프로젝트 루트에 `.env` 파일을 생성하세요:

```env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_CHAT_ID=your_chat_id_here
```

⚠️ `.env` 파일은 절대 GitHub에 커밋하지 마세요! (이미 `.gitignore`에 포함되어 있습니다)

### 7. 테스트 방법

1. 배포 완료 후 사이트 접속
2. 조명을 배치하고 "문의하기" 버튼 클릭
3. 브라우저 콘솔(F12)에서 에러 메시지 확인
4. 텔레그램 봇으로 알림이 오는지 확인

## 추가 도움말

- 환경 변수 설정이 완료되었는데도 문제가 지속되면, Netlify 대시보드의 **Deploys** 탭에서 빌드 로그를 확인하세요.
- 빌드 로그에서 환경 변수가 제대로 주입되었는지 확인할 수 있습니다.

