# 📰 뉴스 기능 재설계 제안 - API 최소화 전략

## 🎯 현재 문제점
- News API, Perplexity, Brave Search 등 유료 API 과다 사용
- GPT 번역 API로 인한 추가 비용
- 실시간 업데이트 시 API 호출 폭증

## 💡 새로운 접근 방법

### 1. **RSS 피드 중심 아키텍처** (API 0회)
```swift
// 무료 축구 RSS 피드 활용
struct RSSFeedService {
    let feeds = [
        "https://www.theguardian.com/football/rss",
        "https://www.espn.com/espn/rss/soccer/news",
        "https://www.football365.com/feed",
        "https://www.goal.com/feeds/en/news",
        "https://talksport.com/feed/"
    ]
    
    func fetchAllFeeds() async -> [NewsItem] {
        // RSS 파싱으로 뉴스 수집
    }
}
```

### 2. **Supabase 백엔드 뉴스 수집 시스템**
```typescript
// Supabase Edge Function - 30분마다 실행
export async function collectNews() {
    // 1. RSS 피드에서 뉴스 수집
    // 2. 중복 제거 및 필터링
    // 3. Supabase DB에 저장
    // 4. 하루 1회만 GPT로 주요 뉴스 요약
}
```

### 3. **하이브리드 접근 - 최소 API 사용**
```swift
class MinimalAPINewsService {
    // 1일 1회만 호출
    func fetchDailyHighlights() async -> [NewsItem] {
        // 1. Supabase에서 캐시된 뉴스 확인
        // 2. 24시간 지났으면 새로 수집
        // 3. 그 외에는 로컬 캐시 사용
    }
    
    // 푸시 알림용 속보만 실시간
    func fetchBreakingNews() async -> [NewsItem] {
        // 1시간에 1회 제한
    }
}
```

### 4. **커뮤니티 기반 뉴스 큐레이션**
```swift
// 사용자들이 뉴스 링크 공유
struct CommunityNewsService {
    // Supabase DB 활용
    func submitNewsLink(_ url: String, by userId: String) async {
        // 1. URL 유효성 검사
        // 2. 메타데이터 추출 (og:tags)
        // 3. 커뮤니티 투표 시스템
    }
    
    func getTopNews() async -> [NewsItem] {
        // 투표 수 기반 정렬
    }
}
```

### 5. **스마트 캐싱 전략**
```swift
class SmartNewsCache {
    // 계층적 캐싱
    // L1: 메모리 캐시 (1시간)
    // L2: 디스크 캐시 (24시간) 
    // L3: Supabase DB (7일)
    
    func getNews(category: NewsCategory) async -> [NewsItem] {
        // 1. 메모리 확인
        // 2. 디스크 확인
        // 3. DB 확인
        // 4. 모두 없으면 RSS 수집
    }
}
```

## 🏗️ 제안하는 아키텍처

### A안: **Zero-API 솔루션** (추천 ⭐)
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  RSS Feeds  │────▶│   Supabase   │────▶│   iOS App   │
└─────────────┘     │  Edge Func   │     └─────────────┘
                    │  (30분마다)   │            │
                    └──────────────┘            ▼
                            │              ┌─────────────┐
                            └─────────────▶│  Local DB   │
                                          └─────────────┘
```

**장점:**
- API 비용 0원
- 안정적인 뉴스 소스
- 오프라인 지원 가능

**구현:**
1. Supabase Edge Function으로 RSS 수집 (30분마다)
2. 수집된 뉴스를 DB에 저장
3. 앱은 Supabase DB에서만 읽기
4. 로컬 SQLite로 오프라인 캐싱

### B안: **최소 API + 커뮤니티**
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ News API    │     │  Community   │     │   iOS App   │
│ (1일 10회)  │────▶│   Links      │────▶│             │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                    ┌──────────────┐
                    │  User Votes  │
                    └──────────────┘
```

**장점:**
- 최신 뉴스 + 커뮤니티 큐레이션
- API 비용 90% 절감
- 사용자 참여 증대

### C안: **웹 스크래핑 + AI 요약**
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ 축구 뉴스   │     │  Scraping    │     │ GPT Summary │
│ 웹사이트    │────▶│  Service     │────▶│ (1일 1회)   │
└─────────────┘     └──────────────┘     └─────────────┘
```

**주의:** robots.txt 준수 필요

## 📱 앱 내 구현 변경사항

### 1. **뉴스 소스 표시**
```swift
struct NewsItemView: View {
    var body: some View {
        HStack {
            // RSS 피드 출처 표시
            Label(news.source, systemImage: "rss")
            
            // 커뮤니티 추천 수
            if let votes = news.communityVotes {
                Label("\(votes)", systemImage: "hand.thumbsup")
            }
        }
    }
}
```

### 2. **오프라인 우선 설계**
```swift
class OfflineFirstNewsService {
    func loadNews() async -> [NewsItem] {
        // 1. 로컬 DB 확인
        if let localNews = await loadFromLocalDB() {
            // 백그라운드에서 업데이트
            Task.detached {
                await self.syncWithServer()
            }
            return localNews
        }
        
        // 2. 온라인에서 가져오기
        return await fetchFromSupabase()
    }
}
```

### 3. **번역 최적화**
```swift
// 서버에서 미리 번역된 콘텐츠 제공
struct PreTranslatedNews {
    let title_en: String
    let title_ko: String
    let title_ja: String
    // ... 다른 언어
    
    func getTitle(for languageCode: String) -> String {
        switch languageCode {
        case "ko": return title_ko
        case "ja": return title_ja
        default: return title_en
        }
    }
}
```

## 💰 비용 비교

| 방식 | 월 예상 비용 | API 호출 수 |
|------|------------|-----------|
| 현재 | $200+ | 20,000+ |
| A안 (RSS) | $0 | 0 |
| B안 (최소 API) | $20 | 300 |
| C안 (스크래핑) | $10 (GPT) | 30 |

## 🚀 구현 우선순위

### Phase 1 (1주일)
1. RSS 피드 파서 구현
2. Supabase Edge Function 설정
3. 로컬 캐싱 시스템

### Phase 2 (2주일)
1. 커뮤니티 링크 공유 기능
2. 투표 시스템
3. 오프라인 모드

### Phase 3 (선택사항)
1. 푸시 알림 (중요 뉴스만)
2. 개인화 추천
3. 북마크/읽기 기록

## 🎯 추천 솔루션

**"RSS + Supabase + 로컬 캐싱"** 조합을 추천합니다:

1. **비용**: 월 $0 (Supabase 무료 티어 내)
2. **성능**: 즉시 로딩 (로컬 캐시)
3. **신뢰성**: RSS는 안정적
4. **확장성**: 필요시 API 추가 가능

이 방식으로 API 의존도를 완전히 제거하면서도 양질의 축구 뉴스를 제공할 수 있습니다.