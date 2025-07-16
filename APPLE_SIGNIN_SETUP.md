# Apple Sign In 설정 가이드

## 1. Xcode 설정

### Signing & Capabilities
1. Xcode에서 프로젝트 열기
2. 프로젝트 네비게이터에서 프로젝트 선택
3. TARGETS → football 선택
4. Signing & Capabilities 탭
5. + Capability 버튼 클릭
6. "Sign In with Apple" 검색 후 추가

## 2. Apple Developer Console 설정

### App ID 구성
1. [Apple Developer](https://developer.apple.com/account) 로그인
2. Certificates, Identifiers & Profiles 선택
3. Identifiers → + 버튼
4. App IDs 선택 → Continue
5. 설정:
   - Description: FutInfo
   - Bundle ID: Explicit → `com.hyunwoopark.futinfo`
   - Capabilities: Sign In with Apple 체크
6. Continue → Register

### Service ID 생성 (Supabase용)
1. Identifiers → + 버튼
2. Services IDs 선택 → Continue
3. 설정:
   - Description: FutInfo Auth Service
   - Identifier: `com.hyunwoopark.futinfo.auth`
4. Continue → Register
5. 생성된 Service ID 선택 → Sign In with Apple 구성:
   - Enable Sign In with Apple 체크
   - Configure 버튼 클릭:
     - Primary App ID: 위에서 만든 App ID 선택
     - Domains and Subdomains: `uutmymaxkkytibuiiaax.supabase.co`
     - Return URLs: `https://uutmymaxkkytibuiiaax.supabase.co/auth/v1/callback`
   - Save

### Key 생성
1. Keys → + 버튼
2. Key Name: FutInfo Auth Key
3. Sign In with Apple 체크
4. Configure → Primary App ID 선택
5. Continue → Register
6. Download 버튼으로 .p8 파일 다운로드 (한 번만 다운로드 가능!)
7. Key ID 기록해두기

## 3. Supabase Dashboard 설정 (간소화된 버전)

1. [Supabase Dashboard](https://app.supabase.com) → 프로젝트 선택
2. Authentication → Providers → Apple
3. Enable Apple Provider 활성화
4. 설정 입력:
   - **Client ID (for OAuth)**: `com.hyunwoopark.futinfo.auth` (Service ID)
   - **Secret Key (for OAuth)**: Apple에서 생성한 Secret Key (아래 방법 참조)

### Secret Key 생성 방법
Apple Developer Console에서:
1. Keys → 생성한 Key 선택
2. "Create Client Secret" 또는 유사한 옵션 사용
3. 또는 [Apple's secret generator tool](https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens) 사용

**참고**: iOS 네이티브 앱에서는 Secret Key가 필수가 아닐 수 있습니다. 
- Client ID만 입력하고 테스트해보세요
- 작동하지 않으면 Secret Key 생성 필요

## 4. 테스트 방법

### 시뮬레이터에서 테스트
1. iOS 시뮬레이터 실행
2. Settings → Sign in to your iPhone
3. Apple ID로 로그인
4. 앱에서 Apple 로그인 버튼 클릭
5. Face ID/Touch ID 프롬프트에서 인증

### 실제 기기에서 테스트
1. 기기가 Apple ID로 로그인되어 있어야 함
2. Settings → Sign In with Apple → 앱별 설정 확인 가능

## 5. 주의사항

- Service ID는 Bundle ID와 다르게 설정해야 함 (보통 .auth 또는 .service 추가)
- Private Key는 한 번만 다운로드 가능하므로 안전하게 보관
- Team ID는 개발자 계정마다 고유함
- 첫 로그인 시 사용자는 이메일 공유 여부를 선택할 수 있음

## 6. 문제 해결

### "Invalid client" 오류
- Service ID가 올바른지 확인
- Supabase에 입력한 Team ID, Key ID 확인

### "Invalid request" 오류
- Return URL이 Supabase URL과 일치하는지 확인
- Domain 설정이 올바른지 확인

### 로그인 후 앱으로 돌아오지 않음
- Info.plist의 URL Scheme 확인
- `footballApp.swift`의 `onOpenURL` 핸들러 확인