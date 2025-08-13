# Brave Search API를 활용한 뉴스 시스템 고도화

## 🎯 통합 전략

### 현재 시스템 + Brave Search = 하이브리드 뉴스 시스템

**RSS (기본 뉴스)**
- 정기적인 뉴스 수집 (하루 3번)
- 신뢰할 수 있는 소스
- 예측 가능한 콘텐츠

**Brave Search (실시간 트렌드)**
- 실시간 검색 기반 뉴스
- 특정 키워드 모니터링
- 사용자 검색 기능
- 월 5,000건 무료 (충분!)

## 📊 Brave Search API 분석

### API 특징
- **무료 한도**: 월 5,000건
- **응답 속도**: <500ms
- **검색 품질**: Google 수준
- **뉴스 특화**: 최신성 필터링 가능

### 활용 가능한 기능
1. **일반 웹 검색**: `brave_web_search`
2. **로컬 검색**: `brave_local_search` (경기장 정보 등)

## 🏗️ 구현 방안

### 1. 하이브리드 뉴스 수집 시스템

```typescript
// supabase/functions/news-collector-enhanced/index.ts

interface NewsCollectorConfig {
  sources: 'rss' | 'brave' | 'both'
  keywords?: string[]
  teams?: string[]
  timeRange?: 'day' | 'week' | 'month'
}

async function collectEnhancedNews(config: NewsCollectorConfig) {
  const allNews = []
  
  // 1. RSS 뉴스 수집 (기존)
  if (config.sources === 'rss' || config.sources === 'both') {
    const rssNews = await collectRSSNews()
    allNews.push(...rssNews)
  }
  
  // 2. Brave Search 뉴스 수집 (신규)
  if (config.sources === 'brave' || config.sources === 'both') {
    const braveNews = await collectBraveNews(config)
    allNews.push(...braveNews)
  }
  
  // 3. 중복 제거 및 병합
  return deduplicateAndMerge(allNews)
}
```

### 2. Brave Search 뉴스 수집기

```typescript
// supabase/functions/brave-news-collector/index.ts

const BRAVE_API_KEY = 'BSAC0hD7H6jJs4kHqj90cglPdEyCWh-'

interface BraveNewsQuery {
  team?: string
  player?: string
  keyword?: string
  freshness?: 'day' | 'week' | 'month'
}

async function searchBraveNews(query: BraveNewsQuery) {
  // 검색 쿼리 구성
  const searchTerms = []
  
  if (query.team) {
    searchTerms.push(`"${query.team}" transfer OR injury OR news`)
  }
  
  if (query.player) {
    searchTerms.push(`"${query.player}" transfer OR goal OR news`)
  }
  
  if (query.keyword) {
    searchTerms.push(query.keyword)
  }
  
  // Brave API 호출
  const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
    headers: {
      'X-Subscription-Token': BRAVE_API_KEY,
      'Accept': 'application/json'
    },
    params: {
      q: searchTerms.join(' '),
      count: 20,
      freshness: query.freshness || 'day',
      search_lang: 'en',
      result_filter: 'news'
    }
  })
  
  // 결과 파싱 및 DB 형식 변환
  const results = await response.json()
  return parseBraveResults(results)
}
```

### 3. 실시간 트렌드 모니터링

```typescript
// 주요 팀/선수 실시간 모니터링
const MONITORING_TARGETS = [
  // 팀
  { type: 'team', name: 'Manchester United', keywords: ['transfer', 'injury', 'lineup'] },
  { type: 'team', name: 'Real Madrid', keywords: ['signing', 'Ancelotti', 'injury'] },
  { type: 'team', name: 'Barcelona', keywords: ['Xavi', 'transfer', 'La Liga'] },
  
  // 선수
  { type: 'player', name: 'Cristiano Ronaldo', keywords: ['goal', 'transfer', 'Saudi'] },
  { type: 'player', name: 'Messi', keywords: ['Inter Miami', 'MLS', 'goal'] },
  { type: 'player', name: 'Haaland', keywords: ['goal', 'injury', 'Manchester City'] },
  
  // 이벤트
  { type: 'event', name: 'Champions League', keywords: ['draw', 'final', 'results'] },
  { type: 'event', name: 'Transfer Window', keywords: ['deadline', 'confirmed', 'medical'] }
]

// 1시간마다 트렌드 체크
async function checkTrendingNews() {
  for (const target of MONITORING_TARGETS) {
    const query = `${target.name} ${target.keywords.join(' OR ')}`
    const news = await searchBraveNews({ 
      keyword: query, 
      freshness: 'day' 
    })
    
    // 중요도 평가
    const importantNews = news.filter(article => {
      return article.relevanceScore > 80
    })
    
    if (importantNews.length > 0) {
      // Breaking News로 표시
      await markAsBreakingNews(importantNews)
    }
  }
}
```

### 4. 사용자 검색 기능

```typescript
// app/news/search/page.tsx
export function NewsSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  
  const handleSearch = async () => {
    // Brave Search API 직접 호출
    const response = await fetch('/api/news/search', {
      method: 'POST',
      body: JSON.stringify({ 
        query,
        includeRSS: true,
        includeBrave: true
      })
    })
    
    const data = await response.json()
    setResults(data.articles)
  }
  
  return (
    <div>
      <SearchInput 
        value={query}
        onChange={setQuery}
        onSearch={handleSearch}
        placeholder="팀, 선수, 이벤트 검색..."
      />
      
      <NewsResults results={results} />
    </div>
  )
}
```

### 5. API 사용량 최적화

```typescript
// 일일 API 사용량 관리
const DAILY_LIMIT = 150 // 월 5000건 / 30일 ≈ 166건/일

interface APIUsage {
  date: string
  brave_calls: number
  deepl_calls: number
}

async function canUseBraveAPI(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data: usage } = await supabase
    .from('api_usage')
    .select('brave_calls')
    .eq('date', today)
    .single()
  
  return !usage || usage.brave_calls < DAILY_LIMIT
}

async function trackAPIUsage(api: 'brave' | 'deepl') {
  const today = new Date().toISOString().split('T')[0]
  
  await supabase.rpc('increment_api_usage', {
    api_type: api,
    date: today
  })
}
```

## 📋 구현 우선순위

### Phase 1: 기본 통합 (1주)
- [ ] Brave Search Edge Function 생성
- [ ] 환경 변수 설정 (API Key)
- [ ] 기본 검색 기능 구현
- [ ] RSS와 병합 로직

### Phase 2: 트렌드 모니터링 (2주)
- [ ] 주요 팀/선수 모니터링 설정
- [ ] Breaking News 자동 감지
- [ ] 중요도 평가 알고리즘
- [ ] 알림 시스템 연동

### Phase 3: 사용자 기능 (3주)
- [ ] 뉴스 검색 UI
- [ ] 검색 히스토리
- [ ] 맞춤 알림 설정
- [ ] 트렌드 대시보드

## 💰 비용 분석

### 월간 API 사용량 예상
```
RSS 수집: 0원 (무료)
Brave Search: 
  - 정기 수집: 30일 × 3회 × 10쿼리 = 900건
  - 사용자 검색: 약 2000건
  - 트렌드 모니터링: 30일 × 24시간 × 2쿼리 = 1440건
  - 총합: 약 4340건 < 5000건 (무료 한도 내)
  
DeepL Translation:
  - 현재: 월 100,000자 사용 중
  - Brave 뉴스 추가: +50,000자
  - 총합: 150,000자 < 500,000자 (무료 한도 내)
```

## 🎯 기대 효과

### 1. 콘텐츠 품질 향상
- **실시간성**: 속보를 놓치지 않음
- **관련성**: 사용자 관심사 정확히 포착
- **다양성**: RSS + Search 조합

### 2. 사용자 경험 개선
- **검색 기능**: 원하는 뉴스 즉시 검색
- **트렌드**: 실시간 인기 토픽
- **알림**: 중요 뉴스 푸시

### 3. 차별화 요소
- **하이브리드**: RSS + Search 조합
- **지능형**: 중요도 자동 평가
- **맞춤형**: 개인화 + 트렌드

## 🔧 기술 스택

```yaml
APIs:
  - Brave Search API (뉴스 검색)
  - DeepL API (번역)
  - RSS Feeds (기본 뉴스)

Backend:
  - Supabase Edge Functions
  - PostgreSQL (캐싱)
  - Cron Jobs (스케줄링)

Frontend:
  - Next.js 14
  - React Query
  - Tailwind CSS

Monitoring:
  - API 사용량 추적
  - 에러 로깅
  - 성능 메트릭
```

## 📝 구현 예시

### Brave Search를 활용한 이적 뉴스 수집
```typescript
// 매일 이적 시장 마감 시간에 실행
async function collectTransferDeadlineNews() {
  const teams = ['Manchester United', 'Chelsea', 'Arsenal', 'Liverpool']
  const allNews = []
  
  for (const team of teams) {
    const results = await searchBrave({
      q: `${team} transfer confirmed deal medical`,
      freshness: 'day',
      count: 10
    })
    
    // 신뢰도 평가
    const trustedNews = results.filter(article => {
      const hasOfficialKeywords = /official|confirmed|completed/.test(article.title.toLowerCase())
      const fromTrustedSource = TRUSTED_SOURCES.includes(article.domain)
      return hasOfficialKeywords || fromTrustedSource
    })
    
    allNews.push(...trustedNews)
  }
  
  // DB 저장 및 번역
  await saveAndTranslate(allNews)
  
  // 중요 뉴스는 Breaking으로 표시
  const breakingNews = allNews.filter(n => n.importance > 90)
  await markAsBreaking(breakingNews)
}
```

## 🚀 결론

Brave Search API를 통합하면:
1. **실시간 트렌드** 포착 가능
2. **사용자 검색** 기능 제공
3. **월 5,000건 무료**로 충분
4. RSS와 **시너지** 효과

이제 FutInfo는 **정적 RSS** + **동적 Search**의 완벽한 조합으로 최고의 축구 뉴스 서비스가 됩니다!