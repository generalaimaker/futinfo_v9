# Supabase Auth 설정 가이드

## 현재 상황
- 로그인 페이지: `/auth/login`
- 회원가입 페이지: `/auth/register`
- 콜백 페이지: `/auth/callback`
- Provider 설정: 완료

## Supabase 대시보드 설정 필요

### 1. URL Configuration
Supabase Dashboard → Authentication → URL Configuration에서 설정:

#### Site URL
```
https://buildup-football.com
```

#### Redirect URLs (허용된 URL들)
```
https://buildup-football.com/auth/callback
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

### 2. OAuth Providers 설정

#### Google OAuth
1. Supabase Dashboard → Authentication → Providers → Google
2. Google Cloud Console에서:
   - OAuth 2.0 Client ID 생성
   - Authorized redirect URIs:
     - `https://uutmymaxkkytibuiiaax.supabase.co/auth/v1/callback`
     - `https://buildup-football.com/auth/callback`
3. Client ID와 Client Secret을 Supabase에 입력

#### Apple OAuth  
1. Supabase Dashboard → Authentication → Providers → Apple
2. Apple Developer Console에서:
   - Sign in with Apple 설정
   - Service ID 생성
   - Return URLs 추가
3. 필요한 정보 Supabase에 입력

### 3. Email Templates (선택사항)
Supabase Dashboard → Authentication → Email Templates에서 커스터마이즈

## 테스트 방법

### 이메일/비밀번호 로그인
1. https://buildup-football.com/auth/register 에서 회원가입
2. 이메일 확인 (필요시)
3. https://buildup-football.com/auth/login 에서 로그인

### Google OAuth
1. 로그인 페이지에서 "Google로 계속하기" 클릭
2. Google 계정 선택
3. 자동으로 /auth/callback으로 리다이렉트

### Apple OAuth
1. 로그인 페이지에서 "Apple로 계속하기" 클릭
2. Apple ID로 로그인
3. 자동으로 /auth/callback으로 리다이렉트

## 현재 코드 구조

### 주요 파일
- `/lib/supabase/client.ts` - Supabase 클라이언트
- `/lib/supabase/provider.tsx` - Auth Provider
- `/app/auth/login/page.tsx` - 로그인 페이지
- `/app/auth/register/page.tsx` - 회원가입 페이지
- `/app/auth/callback/page.tsx` - OAuth 콜백 처리

### 인증 함수
```typescript
// Provider에서 제공되는 함수들
signIn(email, password) - 이메일/비밀번호 로그인
signUp(email, password) - 회원가입
signOut() - 로그아웃
signInWithGoogle() - Google OAuth
signInWithApple() - Apple OAuth
```

## 트러블슈팅

### "Invalid JWT" 에러
- Edge Function의 JWT 검증이 비활성화되어 있는지 확인
- Supabase Anon Key가 올바른지 확인

### OAuth 리다이렉트 실패
- Redirect URLs이 Supabase 대시보드에 등록되어 있는지 확인
- Site URL이 올바르게 설정되어 있는지 확인

### 세션 유지 문제
- persistSession: true 설정 확인
- autoRefreshToken: true 설정 확인