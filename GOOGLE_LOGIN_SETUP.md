# Google Login Setup Guide for FutInfo

## 1. Supabase Dashboard 설정

### Google OAuth 설정
1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택 → Authentication → Providers
3. Google 프로바이더 찾기
4. Enable Google 토글 켜기
5. 다음 정보 필요:
   - **Client ID** (Google Cloud Console에서 가져옴)
   - **Client Secret** (Google Cloud Console에서 가져옴)

### Redirect URLs 확인
1. Supabase Dashboard → Authentication → URL Configuration
2. 다음 URL들을 메모:
   - **Site URL**: `futinfo://` (이미 설정됨)
   - **Redirect URLs**: `futinfo://auth-callback` 추가

## 2. Google Cloud Console 설정

### OAuth 2.0 클라이언트 생성
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 또는 선택
3. APIs & Services → Credentials 이동
4. "+ CREATE CREDENTIALS" → OAuth client ID
5. Application type: **iOS** 선택
6. 다음 정보 입력:
   - **Name**: FutInfo iOS
   - **Bundle ID**: `com.hyunwoopark.futinfo`
7. Create 클릭

### OAuth 동의 화면 설정
1. APIs & Services → OAuth consent screen
2. User Type: External 선택
3. 앱 정보 입력:
   - **App name**: FutInfo
   - **User support email**: 본인 이메일
   - **Developer contact**: 본인 이메일
4. Scopes 추가:
   - `email`
   - `profile`
   - `openid`
5. Test users 추가 (개발 중인 경우)

### 웹 애플리케이션용 OAuth 클라이언트 생성 (Supabase용)
1. Credentials → "+ CREATE CREDENTIALS" → OAuth client ID
2. Application type: **Web application** 선택
3. 다음 정보 입력:
   - **Name**: FutInfo Supabase
   - **Authorized JavaScript origins**: 
     - `https://uutmymaxkkytibuiiaax.supabase.co`
   - **Authorized redirect URIs**:
     - `https://uutmymaxkkytibuiiaax.supabase.co/auth/v1/callback`
4. Create 클릭
5. **Client ID**와 **Client Secret** 복사

## 3. iOS 앱 설정

### Info.plist 업데이트
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.hyunwoopark.futinfo</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>futinfo</string>
        </array>
    </dict>
    <!-- Google Sign-In URL Scheme 추가 -->
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.YOUR_GOOGLE_CLIENT_ID</string>
        </array>
    </dict>
</array>

<!-- Google Sign-In 설정 추가 -->
<key>GIDClientID</key>
<string>YOUR_GOOGLE_CLIENT_ID</string>
```

### LSApplicationQueriesSchemes 추가 (선택사항)
```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>googlechromes</string>
    <string>safari</string>
</array>
```

## 4. 코드 구현 확인사항

### AuthView.swift
- Google 로그인 버튼 이미 구현됨 ✅
- OAuth 콜백 처리 이미 구현됨 (footballApp.swift) ✅

### 필요한 수정사항
현재 코드는 이미 잘 구현되어 있으므로 추가 수정 불필요

## 5. Supabase Dashboard 최종 설정

1. Authentication → Providers → Google
2. 다음 정보 입력:
   - **Client ID**: 웹 애플리케이션용 Client ID
   - **Client Secret**: 웹 애플리케이션용 Client Secret
   - **Authorized Client IDs**: iOS 앱용 Client ID도 추가 (쉼표로 구분)
3. Save

## 6. 테스트

1. 앱 실행
2. 로그인 화면에서 "Google로 계속하기" 버튼 클릭
3. Safari 브라우저가 열리며 Google 로그인 페이지 표시
4. Google 계정으로 로그인
5. 권한 동의
6. 자동으로 앱으로 리다이렉트
7. 로그인 성공 확인

## 문제 해결

### "Invalid OAuth callback URL" 오류
- Supabase Dashboard에서 Redirect URL 확인
- `futinfo://auth-callback` 추가되어 있는지 확인

### "Redirect URI mismatch" 오류
- Google Cloud Console에서 Authorized redirect URIs 확인
- Supabase callback URL이 정확히 입력되어 있는지 확인

### 로그인 후 앱으로 돌아오지 않는 경우
- Info.plist의 URL Scheme 확인
- footballApp.swift의 onOpenURL 핸들러 확인

## 참고 링크
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Sign-In iOS Guide](https://developers.google.com/identity/sign-in/ios/start)