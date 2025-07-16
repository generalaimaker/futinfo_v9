# FutInfo Android App

Kotlin Compose로 개발된 FutInfo Android 앱입니다.

## 요구사항
- Android 7.0+ (API 24+)
- Android Studio Hedgehog+
- Kotlin 1.9+

## 시작하기

1. 프로젝트 열기
```bash
# Android Studio에서 열기
File > Open > Android 폴더 선택
```

2. 환경 설정
`local.properties`에 추가:
```properties
supabase.url=YOUR_SUPABASE_URL
supabase.anon.key=YOUR_ANON_KEY
```

3. 빌드 및 실행
- 에뮬레이터/디바이스 선택
- Run 버튼 클릭

## 주요 기능
- 실시간 경기 정보
- 리그별 순위표
- 팀별 커뮤니티
- Material You 디자인
- 다크 모드 지원

## 아키텍처
- MVVM + Clean Architecture
- Jetpack Compose UI
- Hilt 의존성 주입
- Room 로컬 캐싱
- Retrofit + Supabase

## 빌드 타입
```bash
# Debug 빌드
./gradlew assembleDebug

# Release 빌드
./gradlew assembleRelease
```

## 테스트
```bash
# Unit Tests
./gradlew test

# Instrumented Tests
./gradlew connectedAndroidTest
```