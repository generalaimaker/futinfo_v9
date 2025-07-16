# 🚨 API Rate Limit 문제 해결 방안

## 문제 분석

### 현재 상황:
- **모든 API 요청이 429 오류로 실패** (Too Many Requests)
- API 요청 실패 시 **오래된 캐시 데이터** 표시
- 몇 시간 전 끝난 경기가 "HT" (Half Time)으로 표시

### 근본 원인:
1. **과도한 API 호출**
   - 여러 리그를 동시에 요청
   - 10초마다 라이브 업데이트
   - 캐시 무시하고 강제 새로고침

2. **Rate Limit 도달**
   - Rapid API 무료 플랜: 분당 30회 제한
   - 현재 로그: 동시에 8개 리그 × 여러 날짜 요청

## 즉시 해결 방법

### 1. **임시 캐시 정리**
```swift
// FixturesOverviewView에서 실행
Button("캐시 정리") {
    Task {
        await viewModel.clearOutdatedCacheAndRefresh()
    }
}
```

### 2. **API 호출 최적화**
```swift
// LiveMatchService 수정
private let pollingInterval: TimeInterval = 30.0 // 10초 → 30초로 복원
```

### 3. **스마트 캐싱 전략**
- 라이브 경기만 자주 업데이트
- 종료된 경기는 캐시 사용
- 리그별 순차 로딩

## 장기 해결 방안

### 1. **API 요청 관리자 개선**
```swift
class APIRateLimitManager {
    private let maxRequestsPerMinute = 25 // 여유 두고 설정
    private var requestCount = 0
    private var resetTime = Date()
    
    func canMakeRequest() -> Bool {
        if Date() > resetTime {
            requestCount = 0
            resetTime = Date().addingTimeInterval(60)
        }
        return requestCount < maxRequestsPerMinute
    }
}
```

### 2. **우선순위 기반 업데이트**
- 사용자 선호 팀/리그 우선
- 라이브 경기만 실시간
- 나머지는 캐시 활용

### 3. **백엔드 최적화**
- Supabase Edge Function에서 일괄 처리
- 서버에서 캐싱 관리
- 클라이언트는 결과만 수신

## 당장 할 수 있는 조치

1. **앱 재시작** - 캐시 초기화
2. **설정에서 캐시 정리** 버튼 추가
3. **수동 새로고침** 제한 (Pull-to-refresh 쿨다운)
4. **오프라인 모드** - 캐시된 데이터만 표시

## 코드 수정 제안

### FixturesOverviewViewModel 수정:
```swift
// 캐시 우선 정책
private func loadFixturesForDate(_ date: Date, forceRefresh: Bool = false) async {
    // Rate limit 체크
    if isRateLimited {
        print("⚠️ Rate limit 활성 - 캐시 데이터 사용")
        loadFromCache(date)
        return
    }
    
    // 정상 로드
    // ...
}
```

이렇게 하면 API 한도 초과를 방지하고 항상 최신 데이터를 표시할 수 있습니다.