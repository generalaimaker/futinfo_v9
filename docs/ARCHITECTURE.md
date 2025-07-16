# 크로스 플랫폼 뉴스 시스템 아키텍처

## 1. 백엔드 중심 아키텍처

### 중앙 집중식 뉴스 처리 서버
```
┌─────────────────────────────────────────────────────────┐
│                   뉴스 수집 서버 (Supabase Edge Functions)│
│  - RSS 수집 (60+ 소스)                                   │
│  - 중복 제거 처리                                        │
│  - 뉴스 클러스터링                                       │
│  - 캐싱 (Redis/PostgreSQL)                              │
└─────────────────────────────────────────┬───────────────┘
                                          │
                    ┌─────────────────────┴───────────────────┐
                    │          Supabase Database               │
                    │  - 처리된 뉴스 저장                      │
                    │  - 클러스터 정보 저장                    │
                    │  - 실시간 업데이트 (Realtime)            │
                    └─────────────────────┬───────────────────┘
                                          │
         ┌────────────────┬───────────────┴───────────────┬────────────────┐
         │                │                               │                │
    ┌────▼─────┐    ┌────▼─────┐                   ┌────▼─────┐    ┌────▼─────┐
    │   iOS    │    │ Android  │                   │    Web    │    │   PWA    │
    └──────────┘    └──────────┘                   └──────────┘    └──────────┘
```

## 2. 핵심 구현 전략

### A. 백엔드에서 모든 무거운 작업 처리
```typescript
// Supabase Edge Function: news-aggregator
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  // 1. RSS 수집 (병렬 처리)
  const allNews = await fetchFromAllSources()
  
  // 2. 중복 제거 (서버에서 한 번만)
  const deduplicatedNews = await deduplicateNews(allNews)
  
  // 3. 뉴스 클러스터링
  const clusteredNews = await createNewsClusters(deduplicatedNews)
  
  // 4. DB 저장 및 캐싱
  await saveToDatabase(clusteredNews)
  
  // 5. 실시간 브로드캐스트
  await broadcastUpdate()
})

// 5분마다 자동 실행
```

### B. 통합 API 스펙
```typescript
// API 엔드포인트
interface NewsAPI {
  // 뉴스 목록 (페이징, 필터링 지원)
  GET /api/news
    ?category=transfer|match|injury
    &page=1
    &limit=20
    &lang=ko|en
  
  // 뉴스 상세 (클러스터 정보 포함)
  GET /api/news/:id
  
  // 실시간 업데이트 구독
  WS /api/news/subscribe
}

// 통합 응답 형식
interface NewsResponse {
  data: {
    id: string
    title: string
    summary: string
    source: {
      name: string
      reliability: number
      tier: string
    }
    publishedAt: string
    category: string
    cluster: {
      count: number
      sources: string[]
    }
  }[]
  meta: {
    total: number
    page: number
    hasMore: boolean
  }
}
```

## 3. 클라이언트 구현 표준화

### A. 공통 모델 정의
```swift
// iOS (Swift)
struct NewsArticle: Codable {
    let id: String
    let title: String
    let summary: String
    let source: NewsSource
    let publishedAt: Date
    let category: NewsCategory
    let cluster: NewsCluster?
}

// Android (Kotlin)
data class NewsArticle(
    val id: String,
    val title: String,
    val summary: String,
    val source: NewsSource,
    val publishedAt: Instant,
    val category: NewsCategory,
    val cluster: NewsCluster?
)

// Web (TypeScript)
interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    source: NewsSource;
    publishedAt: string;
    category: NewsCategory;
    cluster?: NewsCluster;
}
```

### B. 디자인 시스템 통합
```yaml
# design-tokens.yaml
colors:
  primary: "#1E88E5"
  tier1: "#2196F3"
  official: "#4CAF50"
  rumour: "#FF9800"
  background: "#FAFAFA"
  
typography:
  headline:
    size: 18
    weight: 600
    lineHeight: 1.3
  
spacing:
  xs: 4
  sm: 8
  md: 16
  lg: 24
  
components:
  card:
    borderRadius: 12
    shadow: "0 2px 4px rgba(0,0,0,0.1)"
    padding: 16
```

## 4. 성능 최적화 전략

### A. 캐싱 계층
```
┌─────────────────┐
│ CloudFlare CDN  │ ← 정적 리소스, API 응답 캐싱
└────────┬────────┘
         │
┌────────▼────────┐
│ Supabase Cache  │ ← PostgreSQL 쿼리 캐싱
└────────┬────────┘
         │
┌────────▼────────┐
│ Client Cache    │ ← 로컬 스토리지/SQLite
└─────────────────┘
```

### B. 클라이언트별 캐싱
```swift
// iOS - CoreData + URLCache
class NewsCacheManager {
    private let urlCache = URLCache(
        memoryCapacity: 50 * 1024 * 1024,  // 50MB
        diskCapacity: 200 * 1024 * 1024     // 200MB
    )
    
    func cacheNews(_ articles: [NewsArticle]) {
        // CoreData에 저장
        // 5분간 유효
    }
}

// Android - Room + OkHttp Cache
class NewsCacheManager(context: Context) {
    private val cache = Cache(
        directory = File(context.cacheDir, "news_cache"),
        maxSize = 200L * 1024L * 1024L // 200MB
    )
    
    private val database = Room.databaseBuilder(
        context,
        NewsDatabase::class.java,
        "news.db"
    ).build()
}

// Web - IndexedDB + Service Worker
class NewsCacheManager {
    private async cacheNews(articles: NewsArticle[]) {
        // IndexedDB에 저장
        const db = await openDB('news-cache', 1);
        const tx = db.transaction('articles', 'readwrite');
        
        // Service Worker로 오프라인 지원
        if ('serviceWorker' in navigator) {
            const cache = await caches.open('news-v1');
            await cache.addAll(articles.map(a => a.url));
        }
    }
}
```

## 5. 실시간 동기화

### Supabase Realtime 활용
```typescript
// 서버: 새 뉴스 브로드캐스트
const { data, error } = await supabase
  .from('news_updates')
  .insert({
    type: 'new_articles',
    category: 'transfer',
    count: 5
  })

// 클라이언트: 실시간 구독
const subscription = supabase
  .channel('news-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'news_updates'
  }, (payload) => {
    // 새 뉴스 알림
    showNewNewsAlert(payload.new)
  })
  .subscribe()
```

## 6. 오프라인 지원

### Progressive Web App (PWA) 전략
```javascript
// service-worker.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/news')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // 캐시 우선, 네트워크 폴백
          return response || fetch(event.request)
            .then(fetchResponse => {
              // 새 응답 캐싱
              return caches.open('news-api-v1')
                .then(cache => {
                  cache.put(event.request, fetchResponse.clone());
                  return fetchResponse;
                });
            });
        })
    );
  }
});
```

## 7. 모니터링 및 분석

### 통합 모니터링 시스템
```typescript
// 클라이언트 성능 추적
interface PerformanceMetrics {
  platform: 'ios' | 'android' | 'web'
  metrics: {
    newsLoadTime: number      // 뉴스 로딩 시간
    cacheHitRate: number      // 캐시 적중률
    errorRate: number         // 에러율
    userEngagement: {
      articlesRead: number
      sourcesViewed: number
    }
  }
}

// Supabase에 메트릭 전송
async function trackPerformance(metrics: PerformanceMetrics) {
  await supabase.from('performance_metrics').insert(metrics)
}
```

## 8. 배포 전략

### CI/CD 파이프라인
```yaml
# GitHub Actions
name: Deploy All Platforms

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Supabase Functions
        run: supabase functions deploy
  
  build-ios:
    runs-on: macos-latest
    steps:
      - name: Build iOS App
        run: xcodebuild archive
  
  build-android:
    runs-on: ubuntu-latest
    steps:
      - name: Build Android App
        run: ./gradlew assembleRelease
  
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - name: Build and Deploy to Vercel
        run: vercel --prod
```

## 9. 비용 최적화

### 효율적인 리소스 사용
1. **RSS 수집**: 5분마다 한 번만 (서버에서)
2. **중복 제거**: 서버에서 한 번만 처리
3. **이미지 최적화**: CloudFlare 이미지 리사이징
4. **API 호출**: 페이징과 필터링으로 최소화

### 예상 비용 (월간)
- Supabase: $25 (Pro 플랜)
- CloudFlare: $20 (Pro 플랜)
- Vercel: $20 (Pro 플랜)
- 총: ~$65/월 (수만 명 사용자 지원)

## 10. 구현 우선순위

1. **Phase 1**: 백엔드 구축
   - Supabase Edge Functions 설정
   - 뉴스 수집 및 중복 제거 로직
   - API 엔드포인트 구현

2. **Phase 2**: 웹 버전 출시
   - React/Next.js 웹앱
   - PWA 지원
   - 디자인 시스템 구축

3. **Phase 3**: 모바일 앱 업데이트
   - iOS/Android API 통합
   - 공통 UI 컴포넌트
   - 오프라인 지원

4. **Phase 4**: 최적화
   - 성능 모니터링
   - A/B 테스팅
   - 사용자 피드백 반영