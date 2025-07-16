# Apple Sign In Error 1000 디버깅 가이드

## Error 1000의 일반적인 원인들

### 1. 시뮬레이터 설정 확인
- Settings → Sign in to your iPhone/iPad
- Apple ID로 로그인되어 있는지 확인
- 로그아웃 후 다시 로그인 시도

### 2. Xcode 프로젝트 설정 확인
- [ ] Signing & Capabilities → Sign In with Apple 추가되어 있나?
- [ ] Team이 올바르게 선택되어 있나?
- [ ] Automatically manage signing 활성화되어 있나?

### 3. Apple Developer Console 확인
- [ ] App ID에 Sign In with Apple이 활성화되어 있나?
- [ ] Service ID의 Bundle ID가 정확한가?
- [ ] Return URLs이 올바르게 설정되어 있나?

### 4. 빌드 클린 및 재시작
```bash
# Xcode에서
1. Product → Clean Build Folder (Shift+Cmd+K)
2. Xcode 재시작
3. 시뮬레이터 재시작
4. 다시 빌드 및 실행
```

### 5. 실제 기기에서 테스트
시뮬레이터 대신 실제 iPhone/iPad에서 테스트해보세요.

### 6. 테스트용 간단한 구현
AuthView.swift에서 테스트를 위해 간단한 로그 추가:

```swift
SignInWithAppleButton(
    .signIn,
    onRequest: { request in
        print("🍎 Apple Sign In 요청 시작")
        request.requestedScopes = [.fullName, .email]
    },
    onCompletion: { result in
        print("🍎 Apple Sign In 결과: \(result)")
        switch result {
        case .success(let authorization):
            print("🍎 성공 - Authorization: \(authorization)")
            performAppleSignIn(authorization: authorization)
        case .failure(let error):
            print("🍎 실패 - Error: \(error)")
            print("🍎 Error Domain: \(error._domain)")
            print("🍎 Error Code: \(error._code)")
            errorMessage = error.localizedDescription
        }
    }
)
```

### 7. Entitlements 파일 확인
프로젝트에 .entitlements 파일이 있다면:
- Sign In with Apple capability가 포함되어 있는지 확인

### 8. 네트워크 연결 확인
- 시뮬레이터/기기가 인터넷에 연결되어 있는지 확인
- VPN 사용 중이라면 비활성화 후 시도

### 9. Apple 시스템 상태
[Apple System Status](https://developer.apple.com/system-status/)에서 Sign In with Apple 서비스 상태 확인

### 10. 대안: 웹 기반 Apple 로그인
만약 네이티브 방식이 계속 실패한다면, OAuth 웹 방식으로 전환 고려