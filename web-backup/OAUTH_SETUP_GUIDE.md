# OAuth 설정 가이드 (localhost 문제 해결)

## 문제
localhost에서 Google/Apple OAuth를 사용할 때 리다이렉트가 제대로 작동하지 않는 문제

## 해결 방법

### 방법 1: ngrok 사용 (권장)

1. **ngrok 설치**
   ```bash
   # macOS (Homebrew)
   brew install ngrok/ngrok/ngrok
   
   # 또는 직접 다운로드
   # https://ngrok.com/download
   ```

2. **ngrok 실행**
   ```bash
   # Next.js 개발 서버 실행
   npm run dev
   
   # 새 터미널에서 ngrok 실행
   ngrok http 3000
   ```

3. **ngrok URL 확인**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

4. **환경 변수 업데이트**
   `.env.local` 파일에서 임시로 변경:
   ```env
   NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io
   ```

5. **Supabase 대시보드 설정**
   - Supabase Dashboard → Authentication → URL Configuration
   - Redirect URLs에 추가:
     - `https://abc123.ngrok.io/auth/callback`
     - `https://abc123.ngrok.io`

### 방법 2: Supabase 로컬 개발 설정

1. **Supabase Dashboard에서 추가 URL 허용**
   - Authentication → URL Configuration → Redirect URLs
   - 다음 URL들을 모두 추가:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000
     http://127.0.0.1:3000/auth/callback
     http://127.0.0.1:3000
     ```

2. **Google OAuth Console 설정**
   - [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services → Credentials → OAuth 2.0 Client IDs
   - Authorized redirect URIs에 추가:
     ```
     http://localhost:3000/auth/callback
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```

### 방법 3: 개발용 임시 해결책

provider.tsx에서 리다이렉트 URL을 동적으로 설정:

```typescript
const signInWithGoogle = async () => {
  const redirectTo = process.env.NODE_ENV === 'development' 
    ? `${window.location.origin}/auth/callback`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) throw error
}
```

## 디버깅 팁

1. **브라우저 콘솔 확인**
   - 개발자 도구 → Console
   - OAuth 관련 에러 메시지 확인

2. **네트워크 탭 확인**
   - 개발자 도구 → Network
   - OAuth 리다이렉트 요청 확인

3. **Supabase 로그 확인**
   - Supabase Dashboard → Logs → Auth
   - 인증 관련 로그 확인

## 주의사항

- ngrok URL은 재시작할 때마다 변경됩니다
- 프로덕션 배포 전에 반드시 환경 변수를 원래대로 복원하세요
- Google/Apple OAuth 설정에서 프로덕션 URL도 함께 등록해두세요