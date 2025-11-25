# 텔레그램 봇 설정 가이드

VELZO 프로젝트에서 텔레그램 알림을 받기 위한 설정 방법입니다.

## 1. 텔레그램 봇 생성하기

### Step 1: BotFather와 대화 시작
1. 텔레그램 앱을 열고 검색창에 `@BotFather`를 검색합니다.
2. `@BotFather`를 선택하고 `/start` 명령어를 보냅니다.

### Step 2: 새 봇 생성
1. `/newbot` 명령어를 보냅니다.
2. 봇의 이름을 입력합니다 (예: `VELZO 알림봇`).
3. 봇의 사용자명을 입력합니다 (예: `velzo_notification_bot`).
   - 사용자명은 반드시 `bot`으로 끝나야 합니다.
   - 이미 사용 중인 이름이면 다른 이름을 사용해야 합니다.

### Step 3: 봇 토큰 받기
- BotFather가 봇 토큰을 제공합니다. 예: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
- **이 토큰을 안전하게 보관하세요!** 이 토큰이 있으면 누구나 봇을 제어할 수 있습니다.

## 2. Chat ID 확인하기

### 방법 1: 봇과 대화 후 Chat ID 확인
1. 생성한 봇을 텔레그램에서 검색합니다 (예: `@velzo_notification_bot`).
2. 봇과 대화를 시작합니다 (`/start` 명령어 전송).
3. 브라우저에서 다음 URL을 열어 Chat ID를 확인합니다:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   `<YOUR_BOT_TOKEN>`을 실제 봇 토큰으로 교체하세요.
4. 응답 JSON에서 `"chat":{"id":123456789}` 부분의 숫자가 Chat ID입니다.

### 방법 2: @userinfobot 사용
1. 텔레그램에서 `@userinfobot`을 검색합니다.
2. 봇과 대화를 시작하면 Chat ID를 알려줍니다.

## 3. 환경 변수 설정

### 로컬 개발 환경 (.env 파일)
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
VITE_TELEGRAM_CHAT_ID=123456789
```

⚠️ **주의**: `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다. 절대 GitHub에 업로드하지 마세요!

### Netlify 환경 변수 설정
1. Netlify 대시보드에 로그인합니다.
2. 프로젝트를 선택합니다.
3. **Site settings** → **Environment variables**로 이동합니다.
4. 다음 변수들을 추가합니다:
   - **Key**: `VITE_TELEGRAM_BOT_TOKEN`
     **Value**: 봇 토큰 (예: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
   - **Key**: `VITE_TELEGRAM_CHAT_ID`
     **Value**: Chat ID (예: `123456789`)
5. **Save**를 클릭합니다.
6. **Deploys** 탭에서 **Trigger deploy** → **Clear cache and deploy site**를 클릭하여 재배포합니다.

## 4. 아임웹 연동 방법

아임웹에서도 텔레그램 알림을 받으려면 다음 방법을 사용할 수 있습니다:

### 방법 1: 아임웹 HTML/JavaScript 코드 삽입

아임웹 폼 제출 시 텔레그램 알림을 보내려면, 아임웹의 **고급 설정** → **HTML/CSS/JS** 섹션에 다음 코드를 추가하세요:

```html
<script>
// 텔레그램 봇 설정
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN'; // 봇 토큰 입력
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID'; // Chat ID 입력

// 폼 제출 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
  // 아임웹 폼 제출 이벤트 감지 (폼 ID에 맞게 수정)
  const form = document.querySelector('form'); // 또는 특정 폼 선택자 사용
  
  if (form) {
    form.addEventListener('submit', async function(e) {
      // 기본 제출 동작은 유지
      
      // 폼 데이터 수집
      const formData = new FormData(form);
      const formEntries = Object.fromEntries(formData);
      
      // 텔레그램 메시지 생성
      let message = '📧 <b>아임웹 문의</b>\n\n';
      
      for (const [key, value] of Object.entries(formEntries)) {
        if (value) {
          message += `<b>${key}:</b> ${value}\n`;
        }
      }
      
      message += `\n🕐 문의 시간: ${new Date().toLocaleString('ko-KR')}`;
      
      // 텔레그램 알림 전송
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
          }),
        });
      } catch (error) {
        console.error('텔레그램 알림 전송 실패:', error);
      }
    });
  }
});
</script>
```

### 방법 2: 아임웹 웹훅 사용

1. 아임웹 관리자 페이지에서 **설정** → **고급 설정** → **웹훅**으로 이동합니다.
2. 웹훅 URL을 생성합니다.
3. 웹훅을 받을 서버를 구축하거나, 간단한 서버리스 함수를 사용합니다.

**서버리스 함수 예시 (Vercel/Netlify Functions):**

```javascript
// netlify/functions/telegram-webhook.js
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  try {
    const formData = JSON.parse(event.body);
    
    let message = '📧 <b>아임웹 문의</b>\n\n';
    for (const [key, value] of Object.entries(formData)) {
      if (value) {
        message += `<b>${key}:</b> ${value}\n`;
      }
    }
    message += `\n🕐 문의 시간: ${new Date().toLocaleString('ko-KR')}`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

## 5. 테스트하기

### VELZO 시뮬레이터에서 테스트
1. 환경 변수를 설정한 후 개발 서버를 재시작합니다.
2. 시뮬레이터에서 "문의하기" 또는 "바로 구매하기" 버튼을 클릭합니다.
3. 텔레그램 봇으로 알림이 오는지 확인합니다.

### 아임웹에서 테스트
1. 아임웹 폼을 제출합니다.
2. 텔레그램 봇으로 알림이 오는지 확인합니다.

## 6. 보안 주의사항

⚠️ **중요**: 
- 봇 토큰과 Chat ID는 절대 공개하지 마세요.
- GitHub에 `.env` 파일을 커밋하지 마세요.
- Netlify 환경 변수는 암호화되어 저장되지만, 팀원과만 공유하세요.
- 아임웹 HTML 코드에 토큰을 직접 넣는 경우, 아임웹 관리자만 접근할 수 있도록 설정하세요.

## 7. 문제 해결

### 알림이 오지 않는 경우
1. 봇 토큰과 Chat ID가 올바른지 확인하세요.
2. 봇과 대화를 시작했는지 확인하세요 (`/start` 명령어 전송).
3. 브라우저 콘솔에서 에러 메시지를 확인하세요.
4. Netlify 환경 변수가 제대로 설정되었는지 확인하고 재배포하세요.

### CORS 에러가 발생하는 경우
- 텔레그램 API는 CORS를 지원하므로 일반적으로 문제가 없습니다.
- 만약 문제가 발생하면, 서버리스 함수를 통해 프록시로 전송하는 방법을 사용하세요.

## 참고 자료

- [Telegram Bot API 공식 문서](https://core.telegram.org/bots/api)
- [BotFather 사용법](https://core.telegram.org/bots/tutorial)

