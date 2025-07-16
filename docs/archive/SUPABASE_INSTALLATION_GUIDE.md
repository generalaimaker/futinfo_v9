# Supabase SDK 설치 가이드

## Xcode에서 Supabase 설치하기

### 1. Swift Package Manager로 추가

1. Xcode 열기
2. 프로젝트 네비게이터에서 프로젝트 파일 선택
3. 프로젝트 설정에서 **Package Dependencies** 탭 선택
4. **+** 버튼 클릭
5. 다음 URL 입력:
   ```
   https://github.com/supabase/supabase-swift
   ```

6. **Add Package** 클릭
7. 버전 선택 (최신 버전 권장)
8. 다음 모듈들을 선택:
   - ✅ Supabase
   - ✅ Auth
   - ✅ Functions
   - ✅ PostgREST
   - ✅ Realtime
   - ✅ Storage

### 2. 설치 확인

Package.resolved 파일에 다음과 같이 추가되어야 합니다:
```json
{
  "identity" : "supabase-swift",
  "kind" : "remoteSourceControl",
  "location" : "https://github.com/supabase/supabase-swift",
  "state" : {
    "branch" : "main",
    "revision" : "...",
    "version" : "2.x.x"
  }
}
```

### 3. 빌드 테스트

1. **Cmd + B**로 빌드
2. 에러가 없는지 확인

## 주의사항

- 최소 iOS 15.0 이상 필요
- Swift 5.9 이상 권장
- 네트워크 연결 필요

## 문제 해결

만약 빌드 에러가 발생하면:
1. **Clean Build Folder** (Shift + Cmd + K)
2. **Resolve Package Versions** (File > Packages > Resolve Package Versions)
3. Xcode 재시작