# ⚽ 일정 표시 아키텍처 리뷰 및 개선안

## 현재 구조 분석

### 1. API 호출 흐름
```
FixturesOverviewView (UI)
    ↓
FixturesOverviewViewModel
    ↓
SupabaseFootballAPIService
    ↓
Supabase Edge Functions (서버 캐싱)
    ↓
Football API (RapidAPI)
```

### 2. 캐싱 레이어 (3단계)

#### 2.1 서버 사이드 (Supabase)
- **위치**: `/supabase/functions/football-api/index.ts`
- **저장소**: `api_cache` 테이블
- **TTL 설정**:
  - 기본: 1시간
  - 미래 날짜: 30분
  - 과거 날짜: 3시간
  - 빈 데이터: 10분
  - 에러: 5분
- **Rate Limit**: 분당 500 요청

#### 2.2 클라이언트 - 메모리 캐시
- **위치**: `FixturesOverviewViewModel`
- **구조**: `cachedFixtures: [String: [Fixture]]`
- **동적 TTL**:
  - 라이브 경기: 1분
  - 예정 경기: 15분
  - 종료 경기: 2시간
  - 과거 날짜: 6시간

#### 2.3 클라이언트 - 영구 저장소
- **APICacheManager**: NSCache + 파일 시스템
- **CoreData**: 7일간 보관 후 자동 삭제

### 3. 실시간 업데이트
- **LiveMatchService**: 10초마다 폴링
- **대상**: 현재 진행 중인 경기만
- **최적화**: 3회 연속 빈 응답 시 자동 중지

## 🚨 발견된 문제점

### 1. 성능 병목 현상
- **순차적 API 호출**: 리그별로 500ms 간격으로 요청
- **과도한 Prefetch**: ±7일 데이터를 미리 로드
- **메모리 압박**: 중복된 데이터 저장

### 2. 안정성 이슈
- **캐시 불일치**: 3개 레이어 간 동기화 문제
- **429 에러**: Rate limit 초과
- **UI 블로킹**: 메인 스레드에서 대량 데이터 처리

### 3. 네트워크 비효율
- **중복 요청**: 동일 날짜/리그 반복 요청
- **요청 취소 불가**: 화면 전환 시에도 계속 요청

## 💡 개선 방안

### 1. 즉시 적용 가능한 개선

#### 1.1 배치 API 요청
```swift
// 현재: 리그별 개별 요청
for league in leagues {
    await loadLeague(league)
    await Task.sleep(500_000_000) // 500ms
}

// 개선: 배치 요청
let allLeagues = leagues.map { $0.id }.joined(separator: ",")
let fixtures = await loadFixtures(leagues: allLeagues)
```

#### 1.2 요청 큐 구현
```swift
class RequestQueue {
    private var pendingRequests: [String: Task<[Fixture], Error>] = [:]
    
    func request(key: String) async throws -> [Fixture] {
        // 중복 요청 방지
        if let existing = pendingRequests[key] {
            return try await existing.value
        }
        
        let task = Task { 
            // API 호출
        }
        pendingRequests[key] = task
        
        defer { pendingRequests[key] = nil }
        return try await task.value
    }
}
```

#### 1.3 메모리 최적화
```swift
// 표시할 날짜 ±2일만 프리페치
let prefetchRange = -2...2
for offset in prefetchRange {
    let date = selectedDate.addingTimeInterval(Double(offset) * 86400)
    await prefetchDate(date)
}
```

### 2. 중기 개선 계획

#### 2.1 단일 캐시 관리자
```swift
class UnifiedCacheManager {
    // 하나의 진실된 소스
    private let cache = NSCache<NSString, CacheEntry>()
    
    func get(key: String) -> [Fixture]? {
        guard let entry = cache.object(forKey: key as NSString),
              !entry.isExpired else { return nil }
        return entry.fixtures
    }
}
```

#### 2.2 백그라운드 처리
```swift
// 정렬/필터링을 백그라운드로
func processFixtures(_ fixtures: [Fixture]) async -> [Fixture] {
    await Task.detached(priority: .userInitiated) {
        fixtures
            .filter { /* ... */ }
            .sorted { /* ... */ }
    }.value
}
```

#### 2.3 지능형 캐시 전략
```swift
// 사용 패턴 기반 캐시
class SmartCache {
    func determineTTL(for date: Date, leagueId: Int) -> TimeInterval {
        // 사용자가 자주 보는 리그는 더 오래 캐시
        let frequency = getUserLeagueFrequency(leagueId)
        
        // 현재 시간 기준 동적 TTL
        if isLiveTime(date) {
            return 60 // 1분
        } else if isToday(date) {
            return 300 * frequency // 5-15분
        } else {
            return 3600 * frequency // 1-3시간
        }
    }
}
```

### 3. 장기 개선 계획

#### 3.1 WebSocket 실시간 업데이트
```swift
// Supabase Realtime 활용
let channel = supabase.realtime.channel("fixtures")
    .on("UPDATE", filter: "status=eq.LIVE") { payload in
        updateLiveFixture(payload.record)
    }
    .subscribe()
```

#### 3.2 GraphQL 도입
- 필요한 필드만 요청
- 한 번의 요청으로 여러 리그 데이터 획득

#### 3.3 차등 동기화
- 변경된 데이터만 업데이트
- 델타 동기화로 네트워크 사용량 감소

## 📈 예상 개선 효과

1. **초기 로딩 시간**: 5-10초 → 1-2초
2. **메모리 사용량**: 50% 감소
3. **네트워크 트래픽**: 70% 감소
4. **사용자 경험**: 즉각적인 반응성

## 🎯 구현 우선순위

1. **즉시**: 배치 API 요청, 메모리 최적화
2. **1주일 내**: 요청 큐, 백그라운드 처리
3. **1개월 내**: 단일 캐시 관리자, 지능형 캐시
4. **3개월 내**: WebSocket, GraphQL 도입