# FutInfo iOS App

SwiftUI로 개발된 FutInfo iOS 앱입니다.

## 요구사항
- iOS 15.0+
- Xcode 15+
- Swift 5.9+

## 시작하기

1. 프로젝트 열기
```bash
open football.xcodeproj
```

2. 환경 설정
`Services/AppConfiguration.swift`에서 Supabase 설정:
```swift
static let supabaseURL = "YOUR_SUPABASE_URL"
static let supabaseAnonKey = "YOUR_ANON_KEY"
```

3. 빌드 및 실행
- 시뮬레이터 선택
- Cmd+R로 실행

## 주요 기능
- 실시간 경기 정보
- 리그별 순위표
- 팀별 커뮤니티
- 실시간 채팅
- 다국어 지원

## 아키텍처
- MVVM 패턴
- Combine Framework
- CoreData 캐싱
- Supabase 백엔드

## 테스트
```bash
# Unit Tests
Cmd+U

# UI Tests
Cmd+Shift+U
```