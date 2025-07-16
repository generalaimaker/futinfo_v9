# 🚀 FutInfo 실시간 업데이트 구현 가이드

## 현재 상태 vs 목표

### 🔴 현재 문제점
- **30초 폴링**: 득점 후 최대 30초 지연
- **1분 캐시**: 추가 지연으로 총 1분 30초까지 지연 가능
- **"not started" 버그**: 경기 시작 후에도 상태 업데이트 안됨

### 🟢 목표
- **10초 이내 업데이트**: 득점, 카드, 교체 등 모든 이벤트
- **실시간 스코어**: 득점자 이름과 시간 즉시 표시
- **라이브 알림**: 중요 이벤트 시 푸시 알림

## 구현 단계

### 1️⃣ 즉시 적용 가능 (완료)

#### LiveMatchService.swift 수정
```swift
// 기존: 30초 폴링
private let pollingInterval: TimeInterval = 30.0

// 수정: 10초 폴링  
private let pollingInterval: TimeInterval = 10.0

// 라이브 경기는 캐시 없이
cachePolicy: .veryShort,  // 5초 캐시
forceRefresh: true       // 항상 새 데이터
```

### 2️⃣ EnhancedLiveMatchService 적용

새로 만든 `EnhancedLiveMatchService`를 사용하면:
- 경기별 개별 타이머 (5-10초)
- 사용자 선호팀은 5초마다 업데이트
- 득점 시 즉시 UI 업데이트

#### FixturesOverviewView에서 사용
```swift
import SwiftUI

struct FixturesOverviewView: View {
    @StateObject private var enhancedLive = EnhancedLiveMatchService.shared
    
    var body: some View {
        // 라이브 경기 표시
        ForEach(enhancedLive.liveMatches) { match in
            LiveMatchRow(match: match)
                .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("GoalScored"))) { notification in
                    // 득점 애니메이션 표시
                    showGoalAnimation(notification)
                }
        }
    }
}
```

### 3️⃣ Supabase Edge Function 배포

1. **Supabase Dashboard에서 테이블 생성**:
```sql
-- 라이브 경기 테이블
CREATE TABLE live_matches (
    fixture_id INTEGER PRIMARY KEY,
    home_team_id INTEGER,
    away_team_id INTEGER,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    status VARCHAR(10),
    elapsed INTEGER,
    events JSONB,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 경기 이벤트 테이블
CREATE TABLE match_events (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER,
    event_type VARCHAR(20),
    minute INTEGER,
    home_score INTEGER,
    away_score INTEGER,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_live_matches_status ON live_matches(status);
CREATE INDEX idx_match_events_fixture ON match_events(fixture_id);
```

2. **Edge Function 배포**:
```bash
supabase functions deploy live-match-updater
```

3. **환경변수 설정**:
```bash
supabase secrets set FOOTBALL_API_KEY=your_api_key
```

4. **Cron Job 설정** (Supabase Dashboard):
- Schedule: `*/5 * * * * *` (5초마다)
- Function: `live-match-updater`

### 4️⃣ 경기 상세 화면 실시간 업데이트

#### FixtureDetailView 수정
```swift
struct FixtureDetailView: View {
    let fixtureId: Int
    @StateObject private var enhancedLive = EnhancedLiveMatchService.shared
    
    var body: some View {
        // 뷰 내용...
    }
    .onAppear {
        // 이 경기만 구독
        enhancedLive.subscribeToMatch(fixtureId)
    }
    .onDisappear {
        // 구독 해제
        enhancedLive.unsubscribeFromMatch(fixtureId)
    }
}
```

## 테스트 방법

### 1. 라이브 경기 확인
```swift
// AppDelegate 또는 앱 시작 부분에 추가
EnhancedLiveMatchService.shared.startEnhancedPolling()
```

### 2. 업데이트 속도 측정
- 득점 발생 시간 기록
- 앱에서 업데이트 시간 확인
- 목표: 10초 이내

### 3. 디버그 로그 확인
```swift
// Console에서 확인
✅ 라이브 경기 업데이트 완료: 5개 경기
✅ 경기 123456: goal, status_change 업데이트
🔔 득점! Ronaldo (35')
```

## 추가 최적화

### WebSocket 연결 (Phase 2)
```swift
// Supabase Realtime 채널 구독
let channel = supabase
    .channel("live_matches")
    .on(.broadcast, event: "goal") { payload in
        // 즉시 UI 업데이트 (< 100ms)
    }
    .subscribe()
```

### 사용자 경험 개선
1. **햅틱 피드백**: 득점 시 진동
2. **사운드 효과**: 득점 알림음
3. **애니메이션**: 스코어 변경 애니메이션
4. **푸시 알림**: 백그라운드에서도 알림

## 성능 지표

### 현재 (개선 전)
- 업데이트 지연: 30-90초
- API 호출: 30초마다
- 캐시: 1분

### 목표 (개선 후)
- 업데이트 지연: 5-10초
- API 호출: 10초마다 (라이브만)
- 캐시: 없음 (라이브)

## 주의사항

1. **API 제한**: 분당 30회 제한 고려
2. **배터리 소모**: 백그라운드에서는 폴링 중지
3. **네트워크 사용량**: WiFi 연결 시에만 5초 폴링

## 결론

이 가이드를 따라 구현하면:
- ✅ 득점 후 10초 이내 업데이트
- ✅ 실시간 스코어와 이벤트
- ✅ FotMob보다 빠른 업데이트
- ✅ 사용자 만족도 향상

다음 단계는 WebSocket을 통한 진짜 실시간(< 1초) 구현입니다!