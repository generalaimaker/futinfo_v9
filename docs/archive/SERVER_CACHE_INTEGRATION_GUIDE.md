# Firebase Functions 서버사이드 캐싱 통합 가이드

## 현재 상황

### 이미 구현된 것
1. **Firebase Functions** (`/footdata-server/functions/index.js`)
   - 경기 일정, 통계, 이벤트, 순위 등 API 캐싱
   - 날짜별 최적화된 TTL 전략
   - 중복 요청 방지 로직
   - Rate limit 관리 (분당 30회)

2. **iOS 앱 통합 준비 완료**
   - `FirebaseFunctionsService.swift` - Firebase Functions 호출 서비스
   - `AppConfiguration.swift` - 설정 관리
   - `FootballAPIService` 확장 - 서버 캐싱 사용 메서드
   - 설정 화면에 토글 추가

## 사용 방법

### 1. Firebase Functions 배포

```bash
cd footdata-server/functions
npm install

# 환경 변수 설정
firebase functions:config:set api.key="YOUR_RAPID_API_KEY" api.host="api-football-v1.p.rapidapi.com"

# 배포
firebase deploy --only functions
```

### 2. iOS 앱에서 Firebase Functions URL 설정

`AppConfiguration.swift`에서 Firebase 프로젝트 URL 수정:
```swift
// Firebase Functions URL (프로덕션)
let firebaseFunctionsURL = "https://asia-northeast3-YOUR-PROJECT-ID.cloudfunctions.net"
```

### 3. 기존 코드 마이그레이션

#### Before (직접 API 호출):
```swift
let fixtures = try await footballService.getFixtures(
    leagueIds: [39],
    season: 2024,
    from: startDate,
    to: endDate
)
```

#### After (서버 캐싱 사용):
```swift
let fixtures = try await footballService.getFixturesWithServerCache(
    date: "2024-01-15",
    leagueId: 39,
    seasonYear: 2024
)
```

### 4. ViewModel 수정 예시

`FixturesViewModel.swift`에서:
```swift
// 기존 코드
private func loadFixtures() async {
    let fixtures = try await apiService.getFixtures(...)
}

// 서버 캐싱 사용
private func loadFixtures() async {
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd"
    let dateString = dateFormatter.string(from: selectedDate)
    
    let fixtures = try await apiService.getFixturesWithServerCache(
        date: dateString,
        leagueId: selectedLeague?.id,
        seasonYear: currentSeason
    )
}
```

## 주요 변경 사항

### 새로운 메서드들

1. **getFixturesWithServerCache**
   - 날짜 기반 경기 조회
   - forceRefresh 옵션 지원

2. **getFixtureStatisticsWithServerCache**
   - 경기 통계 조회

3. **getFixtureEventsWithServerCache**
   - 경기 이벤트 조회

4. **getStandingsWithServerCache**
   - 리그 순위 조회

5. **getHeadToHeadWithServerCache**
   - 상대 전적 조회

6. **getCacheStats**
   - 캐시 통계 조회 (관리자용)

## 장점

1. **비용 절감**
   - Rapid API 호출 횟수 대폭 감소
   - 동일 데이터 중복 요청 방지

2. **성능 향상**
   - 캐시된 데이터로 빠른 응답
   - 서버에서 Rate limit 관리

3. **안정성**
   - API 제한 회피
   - 오류 시 캐시된 데이터 제공

4. **스마트 캐싱**
   - 과거 경기: 3시간 캐싱
   - 미래 경기: 30분 캐싱
   - 기본: 1시간 캐싱

## 모니터링

### 캐시 통계 확인
```swift
if let stats = try await footballService.getCacheStats() {
    print("총 캐시 문서: \(stats.totalDocuments)")
    print("캐시 크기: \(stats.totalSize) bytes")
    print("엔드포인트별 캐시: \(stats.cachesByEndpoint)")
}
```

### Firebase Console에서 모니터링
1. Functions 로그 확인
2. Firestore `apiCache` 컬렉션 확인
3. 사용량 통계 확인

## 주의사항

1. **첫 배포 시**
   - Firebase Functions cold start로 첫 요청이 느릴 수 있음
   - 워밍업을 위해 주기적 호출 고려

2. **캐시 정리**
   - 주기적으로 `cleanupCache` 함수 실행
   - Firebase Console에서 수동 실행 가능

3. **개발/테스트**
   - 로컬 Functions 에뮬레이터 사용 가능
   - `forceRefresh` 옵션으로 캐시 무시 가능

## Android 통합

Android 앱도 동일한 Firebase Functions 엔드포인트 사용:

```kotlin
// NetworkModule.kt 수정
@Provides
@Singleton
fun provideFootballApiService(
    @Named("firebase") firebaseRetrofit: Retrofit
): FootballApiService {
    return if (AppConfig.useFirebaseFunctions) {
        firebaseRetrofit.create(FootballApiService::class.java)
    } else {
        // 기존 직접 API 호출
        retrofit.create(FootballApiService::class.java)
    }
}
```

## 향후 개선 사항

1. **추가 엔드포인트**
   - 선수 정보 캐싱
   - 팀 정보 캐싱
   - 뉴스 데이터 캐싱

2. **실시간 업데이트**
   - 라이브 경기 정보는 캐싱 비활성화
   - WebSocket 연결 고려

3. **분석 도구**
   - 캐시 히트율 분석
   - API 사용량 대시보드