# Supabase 로그인 설정 가이드

## 필수 설정 사항

### 1. Supabase Dashboard 설정

#### Authentication 기본 설정
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택 → Authentication → Configuration

#### URL Configuration
Authentication → URL Configuration에서 다음 설정:

**Redirect URLs** (모두 추가):
```
futinfo://auth-callback
com.hyunwoopark.futinfo://auth-callback
http://localhost:3000/**
```

**Site URL**:
```
futinfo://auth-callback
```

### 2. Google OAuth 설정

#### Google Cloud Console
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services → Credentials
4. OAuth 2.0 Client ID 생성:
   - Application type: iOS
   - Bundle ID: `com.hyunwoopark.futinfo`
5. Client ID 복사

#### Supabase에 Google 설정
1. Supabase Dashboard → Authentication → Providers → Google
2. Enable Google 활성화
3. iOS 용 설정:
   - iOS client ID: Google Cloud Console에서 복사한 Client ID
   - Authorized Client IDs: 같은 Client ID 입력

### 3. Apple Sign In 설정

#### Apple Developer Console
1. [Apple Developer](https://developer.apple.com) 접속
2. Certificates, Identifiers & Profiles → Identifiers
3. App ID 선택 또는 생성:
   - Bundle ID: `com.hyunwoopark.futinfo`
   - Capabilities: Sign In with Apple 활성화
4. Services ID 생성:
   - Identifier: `com.hyunwoopark.futinfo.service`
   - Sign In with Apple 활성화
   - Configure:
     - Primary App ID: 위에서 만든 App ID
     - Website URLs:
       - Domains: `uutmymaxkkytibuiiaax.supabase.co`
       - Return URLs: `https://uutmymaxkkytibuiiaax.supabase.co/auth/v1/callback`

#### Supabase에 Apple 설정
1. Supabase Dashboard → Authentication → Providers → Apple
2. Enable Apple 활성화
3. Service ID: `com.hyunwoopark.futinfo.service`
4. Secret Key는 Apple Developer Console에서 생성 필요

### 4. iOS 앱 설정

#### Info.plist (이미 설정됨)
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>futinfo</string>
        </array>
        <key>CFBundleURLName</key>
        <string>com.hyunwoopark.futinfo</string>
    </dict>
</array>
```

#### Xcode Project
1. Signing & Capabilities → + Capability
2. Sign In with Apple 추가

### 5. 테스트 방법

#### 이메일/비밀번호
- 바로 테스트 가능 (추가 설정 불필요)

#### Google OAuth
1. 실제 디바이스에서 테스트 권장
2. 시뮬레이터에서도 가능하나 Safari 통해 진행

#### Apple Sign In
1. 실제 디바이스 또는 시뮬레이터 모두 가능
2. Apple ID로 로그인 필요

### 6. 문제 해결

#### "localhost" 리다이렉트 오류
- Supabase Dashboard의 Redirect URLs 확인
- URL Scheme이 Info.plist와 일치하는지 확인

#### Google 로그인 실패
- Bundle ID가 Google Cloud Console과 일치하는지 확인
- Client ID가 올바르게 입력되었는지 확인

#### Apple 로그인 실패
- Service ID가 올바른지 확인
- Capabilities에 Sign In with Apple이 추가되었는지 확인

### 7. 프로덕션 체크리스트
- [ ] Supabase Redirect URLs 설정
- [ ] Google OAuth Client ID 설정
- [ ] Apple Service ID 및 Secret Key 설정
- [ ] Info.plist URL Scheme 확인
- [ ] Xcode Capabilities 설정
- [ ] 실제 디바이스에서 테스트