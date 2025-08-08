# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

### OAuth 2.0 Client ID 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. APIs & Services → Credentials 이동
3. "Create Credentials" → "OAuth client ID" 선택

### Application Type
- **Web application** 선택

### Authorized JavaScript origins
```
https://buildup-football.com
http://localhost:3000
```

### Authorized redirect URIs (중요!)
```
https://uutmymaxkkytibuiiaax.supabase.co/auth/v1/callback
```

### Client ID와 Secret 복사
생성 후 나오는:
- Client ID
- Client Secret

## 2. Supabase Dashboard 설정

### Authentication → Providers → Google
1. Enable Google 체크
2. Client ID 입력 (Google에서 복사한 값)
3. Client Secret 입력 (Google에서 복사한 값)
4. Save

## 3. Supabase URL Configuration

### Authentication → URL Configuration
- **Site URL**: `https://buildup-football.com`
- **Redirect URLs**:
  ```
  https://buildup-football.com/auth/callback
  http://localhost:3000/auth/callback
  ```

## 4. 테스트

### 로컬 테스트
1. http://localhost:3000/auth/login 접속
2. "Google로 계속하기" 클릭
3. Google 계정 선택
4. 자동으로 /auth/callback으로 리다이렉트

### 프로덕션 테스트
1. https://buildup-football.com/auth/login 접속
2. "Google로 계속하기" 클릭
3. Google 계정 선택
4. 자동으로 /auth/callback으로 리다이렉트

## 트러블슈팅

### "Error 400: redirect_uri_mismatch"
- Google Cloud Console의 Authorized redirect URIs 확인
- 정확히 `https://uutmymaxkkytibuiiaax.supabase.co/auth/v1/callback` 추가

### "Invalid Site URL"
- Supabase Dashboard의 Site URL 확인
- `https://buildup-football.com` 설정

### 로그인 후 리다이렉트 실패
- Supabase Dashboard의 Redirect URLs에 콜백 URL 추가
- `/auth/callback` 페이지가 제대로 구현되어 있는지 확인