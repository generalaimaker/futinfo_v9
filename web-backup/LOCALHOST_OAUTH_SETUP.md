# 로컬호스트에서 Google OAuth 설정하기

## 필수 설정 단계

### 1. Supabase Dashboard 설정
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Authentication** → **Providers** → **Google** 클릭
4. Google이 활성화되어 있는지 확인

### 2. Redirect URLs 설정
1. **Authentication** → **URL Configuration**으로 이동
2. **Redirect URLs** 섹션에 다음 URL들을 추가:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000
   ```

### 3. Google Cloud Console 설정 (중요!)
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. Supabase가 사용하는 프로젝트 선택
3. **APIs & Services** → **Credentials**
4. OAuth 2.0 Client ID 클릭
5. **Authorized redirect URIs**에 추가:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

## 테스트 방법

1. 개발 서버 실행:
   ```bash
   npm run dev
   ```

2. 브라우저 콘솔 열기 (F12)

3. http://localhost:3000/auth/login 접속

4. "Google로 로그인" 클릭

5. 콘솔에서 다음 로그 확인:
   - `Google OAuth redirect URL: http://localhost:3000/auth/callback`
   - `OAuth initiated: {...}`

## 일반적인 문제 해결

### 1. "redirect_uri_mismatch" 에러
- Google Cloud Console에서 redirect URI가 정확히 일치하는지 확인
- http와 https 구분 주의
- 포트 번호(3000) 확인

### 2. 계속 로딩되는 문제
- 브라우저 개발자 도구 → Network 탭에서 실패한 요청 확인
- Console 탭에서 에러 메시지 확인

### 3. CORS 에러
- Supabase Dashboard에서 CORS 설정 확인
- Site URL이 올바르게 설정되어 있는지 확인

## 대안: ngrok 사용

로컬호스트 대신 ngrok을 사용하면 더 안정적으로 작동합니다:

```bash
# ngrok 설치 (Mac)
brew install ngrok/ngrok/ngrok

# ngrok 실행
ngrok http 3000

# 생성된 https URL을 Supabase와 Google Console에 추가
```

## 현재 설정 확인

현재 코드는 로컬호스트를 지원하도록 설정되어 있습니다:
- `provider.tsx`에서 개발 환경일 때 `window.location.origin` 사용
- `/auth/callback` 페이지에서 OAuth 코드 교환 처리

위의 설정을 완료하면 로컬호스트에서도 Google 로그인이 작동합니다!