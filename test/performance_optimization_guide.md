# 성능 최적화 가이드

## 1. 웹 성능 최적화

### React 컴포넌트 최적화
```typescript
// useMemo로 계산 비용이 높은 작업 최적화
const groupedFixtures = useMemo(() => {
  return groupFixturesByLeague(fixtures);
}, [fixtures]);

// useCallback으로 함수 재생성 방지
const handleFixtureUpdate = useCallback((fixtureId: number) => {
  refetch();
}, [refetch]);

// React.memo로 불필요한 리렌더링 방지
export default React.memo(LiveMatchCard);
```

### 이미지 최적화
```typescript
// Next.js Image 컴포넌트 활용
<Image
  src={team.logo}
  alt={team.name}
  width={32}
  height={32}
  loading="lazy"
  placeholder="blur"
/>

// 이미지 프리로딩
const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};
```

### API 요청 최적화
```typescript
// 병렬 요청
const [fixtures, events, stats] = await Promise.all([
  fetchFixtures(),
  fetchEvents(),
  fetchStatistics()
]);

// 요청 디바운싱
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

## 2. iOS 성능 최적화

### SwiftUI 뷰 최적화
```swift
// @StateObject 대신 @ObservedObject 사용 (재사용 시)
@ObservedObject var viewModel: LiveMatchViewModel

// 계산 프로퍼티 캐싱
private var sortedMatches: [LiveMatch] {
    return liveMatches.sorted { $0.matchDate < $1.matchDate }
}

// LazyVStack으로 대량 데이터 렌더링
LazyVStack {
    ForEach(matches) { match in
        MatchRow(match: match)
    }
}
```

### 메모리 관리
```swift
// 약한 참조로 순환 참조 방지
sink { [weak self] match in
    self?.updateMatch(match)
}

// 타이머 정리
deinit {
    refreshTimer?.invalidate()
    refreshTimer = nil
}
```

### 네트워크 최적화
```swift
// URLSession 설정
let configuration = URLSessionConfiguration.default
configuration.timeoutIntervalForRequest = 30
configuration.timeoutIntervalForResource = 60
configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
```

## 3. Android 성능 최적화

### Kotlin Coroutines 최적화
```kotlin
// 적절한 디스패처 사용
viewModelScope.launch(Dispatchers.IO) {
    val data = fetchData()
    withContext(Dispatchers.Main) {
        updateUI(data)
    }
}

// Flow 수집 최적화
liveMatchFlow
    .flowOn(Dispatchers.IO)
    .distinctUntilChanged()
    .collect { matches ->
        updateMatches(matches)
    }
```

### RecyclerView 최적화
```kotlin
// DiffUtil 사용
class MatchDiffCallback : DiffUtil.ItemCallback<Match>() {
    override fun areItemsTheSame(oldItem: Match, newItem: Match) = 
        oldItem.id == newItem.id
    
    override fun areContentsTheSame(oldItem: Match, newItem: Match) = 
        oldItem == newItem
}

// ViewHolder 패턴
class MatchViewHolder(view: View) : RecyclerView.ViewHolder(view) {
    fun bind(match: Match) {
        // 뷰 바인딩
    }
}
```

## 4. 데이터베이스 최적화

### 인덱스 전략
```sql
-- 자주 조회되는 컬럼에 인덱스
CREATE INDEX idx_fixtures_date ON fixtures(date);
CREATE INDEX idx_fixtures_league_season ON fixtures(league_id, season);

-- 복합 인덱스로 조인 성능 향상
CREATE INDEX idx_live_matches_composite ON live_matches(fixture_id, last_updated);

-- 부분 인덱스로 특정 조건 최적화
CREATE INDEX idx_active_matches ON live_matches(fixture_id) 
WHERE status_short IN ('1H', '2H', 'HT', 'ET', 'P');
```

### 쿼리 최적화
```sql
-- EXPLAIN ANALYZE로 쿼리 분석
EXPLAIN ANALYZE
SELECT * FROM live_matches 
WHERE last_updated > NOW() - INTERVAL '5 minutes';

-- 불필요한 데이터 제외
SELECT fixture_id, home_score, away_score, status_short
FROM live_matches
WHERE status_short != 'FT'
LIMIT 50;
```

## 5. Realtime 최적화

### 채널 관리
```typescript
// 선택적 구독
const channel = supabase
  .channel('live-matches')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'live_matches',
    filter: `status_short=in.(1H,2H,HT)`
  }, handleUpdate);

// 구독 정리
useEffect(() => {
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### 메시지 배칭
```typescript
// 업데이트 배칭
const batchedUpdates = useMemo(() => {
  return debounce((updates: any[]) => {
    processBatch(updates);
  }, 100);
}, []);
```

## 6. 캐싱 전략

### 브라우저 캐싱
```typescript
// Service Worker로 API 응답 캐싱
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/fixtures')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
```

### 앱 내 캐싱
```swift
// iOS - URLCache 설정
let cache = URLCache(
    memoryCapacity: 10 * 1024 * 1024,
    diskCapacity: 50 * 1024 * 1024,
    diskPath: nil
)
URLCache.shared = cache
```

## 7. 모니터링 및 프로파일링

### 성능 메트릭 수집
```typescript
// Web Vitals 측정
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 에러 추적
```typescript
// Sentry 통합
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
});
```

## 8. 최적화 체크리스트

### 개발 단계
- [ ] 컴포넌트 메모이제이션 적용
- [ ] 이미지 최적화 및 lazy loading
- [ ] API 요청 병렬화
- [ ] 불필요한 리렌더링 제거

### 배포 전
- [ ] 번들 크기 분석 및 최적화
- [ ] 프로덕션 빌드 설정 확인
- [ ] 캐싱 정책 설정
- [ ] 성능 테스트 실행

### 운영 중
- [ ] 실시간 모니터링 확인
- [ ] 사용자 피드백 수집
- [ ] 병목 지점 분석
- [ ] 정기적 성능 리뷰