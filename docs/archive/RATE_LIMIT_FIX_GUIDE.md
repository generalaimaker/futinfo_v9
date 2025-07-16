# 🔧 Rate Limit 문제 해결 가이드

## 문제 원인

유료 플랜(75,000 요청/월)인데도 429 오류가 발생하는 이유:

1. **Firebase Functions**: `MAX_REQUESTS_PER_MINUTE = 30`
2. **Supabase Edge Functions**: `MAX_REQUESTS_PER_MINUTE = 30`
3. **동시 다발적 요청**: 8개 리그 × 여러 날짜 = 초당 수십 개 요청

## 즉시 해결 방법

### 1. 서버 측 Rate Limit 증가

#### Supabase Edge Function 수정:
```typescript
// supabase/functions/football-api/index.ts
const MAX_REQUESTS_PER_MINUTE = 100 // 30 → 100으로 증가

// IP별이 아닌 전체 요청으로 변경
function checkRateLimit(): boolean {
  // 유료 플랜이므로 더 관대하게
  return true; // 임시로 rate limit 비활성화
}
```

#### 또는 Firebase Functions 수정:
```javascript
// footdata-server/functions/index.js
const MAX_REQUESTS_PER_MINUTE = 100; // 30 → 100으로 증가
```

### 2. 클라이언트 측 최적화

```swift
// FixturesOverviewViewModel 개선
class SmartFixturesLoader {
    // 1. 순차적 로딩
    func loadLeaguesSequentially() async {
        for league in leagues {
            await loadLeague(league)
            try? await Task.sleep(nanoseconds: 100_000_000) // 0.1초 간격
        }
    }
    
    // 2. 우선순위 기반
    func loadByPriority() async {
        // 라이브 경기만 먼저
        let liveFixtures = await loadLiveOnly()
        
        // 나머지는 천천히
        await loadRestWithDelay()
    }
}
```

### 3. 캐시 정책 개선

```swift
// 라이브가 아닌 경기는 캐시 적극 활용
private func shouldUseCache(for fixture: Fixture) -> Bool {
    if liveStatuses.contains(fixture.status.short) {
        return false // 라이브는 항상 새 데이터
    }
    
    // 종료된 경기는 6시간 캐시
    if fixture.status.short == "FT" {
        return true
    }
    
    return true
}
```

## 배포 방법

### Supabase Edge Function 업데이트:
```bash
# 1. 코드 수정
# MAX_REQUESTS_PER_MINUTE = 100

# 2. 배포
supabase functions deploy football-api

# 3. 환경변수 확인
supabase secrets list
```

### Firebase Functions 업데이트:
```bash
# 1. 코드 수정
# MAX_REQUESTS_PER_MINUTE = 100

# 2. 배포
cd footdata-server
firebase deploy --only functions
```

## 임시 해결책 (서버 수정 전)

```swift
// SimpleLiveMatchService 수정
class SimpleLiveMatchService {
    // 폴링 간격을 늘려서 요청 수 줄이기
    private let fastPollingInterval: TimeInterval = 30.0 // 10초 → 30초
    
    // 중요 경기만 업데이트
    func updateOnlyImportantMatches() {
        let userTeams = getUserFavoriteTeams()
        // 사용자 팀 경기만 자주 업데이트
    }
}
```

## 권장 사항

1. **서버 Rate Limit을 100-200으로 증가** (유료 플랜이므로)
2. **클라이언트에서 순차적 요청** 구현
3. **캐시 적극 활용**으로 불필요한 요청 감소
4. **WebSocket 도입** 검토 (실시간 업데이트)

이렇게 하면 유료 플랜의 한도(75,000/월)를 충분히 활용하면서도 Rate Limit 문제를 해결할 수 있습니다!