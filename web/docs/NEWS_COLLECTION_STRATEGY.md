# 축구 뉴스 수집 전략 (최적화)

## 📊 수집 주기 설계

### 1. 정기 수집 (30분마다)
```typescript
// 30분마다 주요 카테고리별 뉴스 수집
const COLLECTION_INTERVAL = 30 * 60 * 1000 // 30분

const categories = [
  { type: 'match', query: 'football match result lineup preview' },
  { type: 'transfer', query: 'transfer news signing confirmed medical' },
  { type: 'injury', query: 'injury update return fitness suspended' },
  { type: 'breaking', query: 'breaking news official confirmed' }
]
```

### 2. 시간대별 차별화 수집
```typescript
interface CollectionSchedule {
  hour: number
  categories: string[]
  frequency: number // 분 단위
}

const schedule: CollectionSchedule[] = [
  // 유럽 경기 시간대 (한국 시간 새벽-아침)
  { hour: 2, categories: ['match', 'lineup'], frequency: 15 },
  { hour: 3, categories: ['match', 'lineup'], frequency: 15 },
  { hour: 4, categories: ['match', 'result'], frequency: 15 },
  { hour: 5, categories: ['match', 'result'], frequency: 15 },
  
  // 일반 시간대
  { hour: 9, categories: ['transfer', 'injury'], frequency: 30 },
  { hour: 12, categories: ['transfer', 'breaking'], frequency: 30 },
  { hour: 18, categories: ['preview', 'lineup'], frequency: 30 },
  { hour: 21, categories: ['transfer', 'injury'], frequency: 30 },
]
```

## 🎯 주요 타겟

### 유럽 5대 리그 팀 (우선순위 높음)
```typescript
const PRIORITY_TEAMS = {
  premier: [
    'Manchester United', 'Liverpool', 'Manchester City', 
    'Chelsea', 'Arsenal', 'Tottenham'
  ],
  laliga: [
    'Real Madrid', 'Barcelona', 'Atletico Madrid'
  ],
  seriea: [
    'Juventus', 'Inter Milan', 'AC Milan', 'Napoli'
  ],
  bundesliga: [
    'Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen'
  ],
  ligue1: [
    'PSG', 'Marseille', 'Monaco'
  ]
}
```

## 🔄 중복 제거 전략

### 1. URL 기반 중복 체크
```typescript
async function deduplicateArticles(newArticles: Article[]) {
  // 최근 24시간 내 수집된 URL 가져오기
  const { data: existingUrls } = await supabase
    .from('news_articles')
    .select('url')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  
  const urlSet = new Set(existingUrls?.map(item => item.url))
  
  // 중복 제거
  return newArticles.filter(article => !urlSet.has(article.url))
}
```

### 2. 제목 유사도 체크
```typescript
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(' '))
  const words2 = new Set(str2.toLowerCase().split(' '))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

async function removeSimilarArticles(articles: Article[]) {
  const filtered: Article[] = []
  
  for (const article of articles) {
    const isDuplicate = filtered.some(existing => 
      calculateSimilarity(existing.title, article.title) > 0.8
    )
    
    if (!isDuplicate) {
      filtered.push(article)
    }
  }
  
  return filtered
}
```

## 📰 하이브리드 수집 시스템

### RSS + Brave Search 조합
```typescript
async function collectHybridNews() {
  const allNews: Article[] = []
  
  // 1. RSS 피드 수집 (기본 뉴스)
  const rssNews = await collectRSSFeeds([
    'https://www.skysports.com/rss/12040', // Sky Sports
    'https://www.theguardian.com/football/rss', // Guardian
    'https://www.goal.com/en/feeds/news', // Goal.com
    // ... 기타 RSS 피드
  ])
  allNews.push(...rssNews)
  
  // 2. Brave Search로 보완 (놓친 뉴스, 속보)
  for (const team of Object.values(PRIORITY_TEAMS).flat()) {
    const searchResults = await searchBraveNews({
      query: `"${team}" news`,
      freshness: 'day',
      count: 10
    })
    allNews.push(...searchResults.articles)
  }
  
  // 3. 중복 제거
  const uniqueNews = await deduplicateArticles(allNews)
  
  // 4. 중요도 점수 계산
  const scoredNews = calculateImportanceScores(uniqueNews)
  
  // 5. DB 저장
  await saveToDatabase(scoredNews)
  
  return scoredNews
}
```

## 🚨 속보 감지 시스템

### Breaking News 키워드
```typescript
const BREAKING_KEYWORDS = [
  // 이적
  'done deal', 'confirmed', 'signs for', 'medical completed',
  'official', 'announcement', 'agreement reached',
  
  // 부상
  'injury blow', 'ruled out', 'sidelined', 'surgery',
  
  // 감독
  'sacked', 'resigned', 'appointed', 'new manager',
  
  // 경기
  'red card', 'penalty', 'comeback', 'upset',
  
  // 일반
  'breaking', 'exclusive', 'update', 'latest'
]

function isBreakingNews(article: Article): boolean {
  const text = (article.title + ' ' + article.description).toLowerCase()
  
  // 키워드 체크
  const hasBreakingKeyword = BREAKING_KEYWORDS.some(keyword => 
    text.includes(keyword)
  )
  
  // 시간 체크 (1시간 이내)
  const isRecent = Date.now() - new Date(article.published_at).getTime() < 60 * 60 * 1000
  
  // 신뢰도 체크
  const isReliable = article.trust_score >= 70
  
  return hasBreakingKeyword && isRecent && isReliable
}
```

## 📊 우선순위 시스템

### 뉴스 중요도 점수
```typescript
function calculateImportanceScore(article: Article): number {
  let score = 0
  
  // 1. 카테고리별 기본 점수
  const categoryScores = {
    'transfer': 90,
    'injury': 85,
    'match': 80,
    'lineup': 75,
    'preview': 70,
    'analysis': 60
  }
  score += categoryScores[article.category] || 50
  
  // 2. 팀 중요도
  const teamName = extractTeamName(article)
  if (PRIORITY_TEAMS.premier.includes(teamName)) score += 30
  else if (Object.values(PRIORITY_TEAMS).flat().includes(teamName)) score += 20
  
  // 3. 최신성
  const hoursAgo = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60)
  if (hoursAgo < 1) score += 25
  else if (hoursAgo < 3) score += 15
  else if (hoursAgo < 6) score += 10
  
  // 4. 신뢰도
  score += article.trust_score * 0.3
  
  // 5. 속보 여부
  if (isBreakingNews(article)) score += 50
  
  return Math.min(score, 200)
}
```

## 📱 사용자 경험 최적화

### 1. 캐싱 전략
```typescript
// Redis 캐싱 (5분)
const CACHE_TTL = 5 * 60 // 5분

async function getCachedNews(category?: string) {
  const cacheKey = `news:${category || 'all'}`
  
  // 캐시 확인
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // DB에서 가져오기
  const news = await fetchFromDatabase(category)
  
  // 캐시 저장
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(news))
  
  return news
}
```

### 2. 실시간 업데이트 UI
```typescript
// 클라이언트 자동 새로고침
useEffect(() => {
  const interval = setInterval(() => {
    // 5분마다 새 뉴스 확인
    refetch()
  }, 5 * 60 * 1000)
  
  return () => clearInterval(interval)
}, [])

// 속보 알림
useEffect(() => {
  const checkBreakingNews = async () => {
    const news = await fetchBreakingNews()
    if (news.length > 0) {
      showNotification({
        title: '⚡ 속보',
        message: news[0].title,
        action: () => navigateToNews(news[0].id)
      })
    }
  }
  
  // 2분마다 속보 체크
  const interval = setInterval(checkBreakingNews, 2 * 60 * 1000)
  return () => clearInterval(interval)
}, [])
```

## 📈 월간 API 사용량 예상

```
정기 수집 (30분):
- 48회/일 × 4카테고리 × 20개 결과 = 3,840 요청/일
- 월간: 115,200 요청

팀별 검색:
- 20팀 × 48회/일 × 10개 결과 = 9,600 요청/일
- 월간: 288,000 요청

사용자 검색:
- 1000회/일 예상
- 월간: 30,000 요청

총합: 약 433,200 요청/월 (2.2% 사용)
```

## 🎯 구현 우선순위

### Phase 1 (즉시)
- [x] 30분 정기 수집 Cron Job
- [x] URL 중복 제거
- [x] 중요도 점수 시스템
- [x] 속보 감지

### Phase 2 (1주일)
- [ ] 시간대별 차별화 수집
- [ ] 제목 유사도 중복 제거
- [ ] Redis 캐싱
- [ ] 실시간 UI 업데이트

### Phase 3 (2주일)
- [ ] 팀별 맞춤 수집
- [ ] 경기일 특별 모드
- [ ] 이적 마감일 집중 모드
- [ ] 푸시 알림 시스템

이 전략으로 효율적이면서도 놓치는 뉴스 없이 종합적인 커버리지를 제공할 수 있습니다!