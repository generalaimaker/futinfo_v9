# 5분 간격 뉴스 수집 전략

## 📊 API 사용량 계산

### 5분마다 수집 시
```
하루 실행 횟수: 24시간 × 12회/시간 = 288회/일

각 실행당 요청:
- 카테고리 검색: 4개 × 10결과 = 4 요청
- 주요 팀 검색: 5팀 × 5결과 = 5 요청
- 총: 9 요청/실행

일일 총 요청: 288 × 9 = 2,592 요청
월간 총 요청: 77,760 요청 (0.39% 사용!)
```

**결론: 월 2천만 한도의 0.39%만 사용 - 매우 여유로움!**

## 🎯 스마트 수집 전략

### 1. 시간대별 차별화
```typescript
function getCollectionConfig() {
  const hour = new Date().getHours()
  const day = new Date().getDay()
  
  // 주말 경기 시간 (한국 기준)
  if ((day === 0 || day === 6) && hour >= 20 && hour <= 24) {
    return {
      interval: 2, // 2분마다
      queries: ['live score', 'goal', 'red card', 'result'],
      priority: 'match'
    }
  }
  
  // 유럽 경기 시간 (한국 새벽)
  if (hour >= 2 && hour <= 6) {
    return {
      interval: 3, // 3분마다
      queries: ['match', 'lineup', 'result', 'goal'],
      priority: 'match'
    }
  }
  
  // 이적 시장 활발 시간 (유럽 오후)
  if (hour >= 18 && hour <= 22) {
    return {
      interval: 5, // 5분마다
      queries: ['transfer', 'signing', 'medical', 'confirmed'],
      priority: 'transfer'
    }
  }
  
  // 일반 시간
  return {
    interval: 5, // 5분마다
    queries: ['news', 'update', 'injury', 'preview'],
    priority: 'general'
  }
}
```

### 2. 이벤트 기반 집중 모드
```typescript
// 이적 마감일 모드
const TRANSFER_DEADLINE_DATES = [
  '2024-01-31', // 겨울 이적시장 마감
  '2024-08-31', // 여름 이적시장 마감
]

function isTransferDeadlineMode(): boolean {
  const today = new Date().toISOString().split('T')[0]
  const daysUntilDeadline = TRANSFER_DEADLINE_DATES
    .map(date => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    .filter(days => days >= 0 && days <= 3)
  
  return daysUntilDeadline.length > 0
}

// 빅매치 모드
async function isBigMatchMode(): Promise<boolean> {
  const { data: matches } = await supabase
    .from('fixtures')
    .select('*')
    .gte('date', new Date().toISOString())
    .lte('date', new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()) // 6시간 이내
    .in('home_team_id', [33, 40, 50, 541, 529]) // 빅클럽
    .in('away_team_id', [33, 40, 50, 541, 529])
  
  return (matches?.length || 0) > 0
}
```

### 3. 스마트 쿼리 시스템
```typescript
interface SmartQuery {
  base: string[]
  realtime: string[]
  trending: string[]
}

const SMART_QUERIES: SmartQuery = {
  base: [
    'football news',
    'soccer update',
    'premier league',
    'champions league'
  ],
  realtime: [
    'breaking LIVE',
    'goal scored',
    'red card',
    'penalty',
    'injury substitution'
  ],
  trending: [] // 동적으로 업데이트
}

// 트렌딩 키워드 자동 업데이트
async function updateTrendingQueries() {
  // 최근 1시간 인기 검색어 분석
  const { data: searches } = await supabase
    .from('search_history')
    .select('query')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .limit(100)
  
  // 빈도수 계산
  const frequency = searches?.reduce((acc, { query }) => {
    acc[query] = (acc[query] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // 상위 5개 트렌딩
  SMART_QUERIES.trending = Object.entries(frequency || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([query]) => query)
}
```

## 📱 실시간 업데이트 시스템

### 1. WebSocket 연결 (실시간 푸시)
```typescript
// 서버: 속보 발생 시 즉시 푸시
import { Server } from 'socket.io'

const io = new Server()

async function broadcastBreakingNews(article: Article) {
  if (article.is_breaking && article.importance_score > 150) {
    io.emit('breaking-news', {
      id: article.id,
      title: article.title,
      category: article.category,
      team_ids: article.team_ids
    })
  }
}

// 클라이언트: 실시간 수신
import { io } from 'socket.io-client'

useEffect(() => {
  const socket = io()
  
  socket.on('breaking-news', (news) => {
    // 토스트 알림
    toast({
      title: '⚡ 속보',
      description: news.title,
      action: () => router.push(`/news/${news.id}`)
    })
    
    // 뉴스 목록 자동 갱신
    queryClient.invalidateQueries(['news'])
  })
  
  return () => socket.disconnect()
}, [])
```

### 2. 캐싱 최적화
```typescript
// 3단계 캐싱 전략
const CACHE_LAYERS = {
  // 1. 메모리 캐시 (1분)
  memory: new Map<string, { data: any, expires: number }>(),
  
  // 2. Redis 캐시 (5분)
  redis: {
    ttl: 5 * 60,
    prefix: 'news:'
  },
  
  // 3. DB 캐시 (영구)
  database: 'news_articles'
}

async function getCachedNews(category?: string) {
  const key = `news:${category || 'all'}`
  
  // 1. 메모리 체크
  const memCache = CACHE_LAYERS.memory.get(key)
  if (memCache && memCache.expires > Date.now()) {
    return memCache.data
  }
  
  // 2. Redis 체크
  const redisCache = await redis.get(key)
  if (redisCache) {
    // 메모리에도 저장
    CACHE_LAYERS.memory.set(key, {
      data: JSON.parse(redisCache),
      expires: Date.now() + 60000
    })
    return JSON.parse(redisCache)
  }
  
  // 3. DB에서 가져오기
  const dbData = await fetchFromDatabase(category)
  
  // 모든 캐시 레이어 업데이트
  await redis.setex(key, CACHE_LAYERS.redis.ttl, JSON.stringify(dbData))
  CACHE_LAYERS.memory.set(key, {
    data: dbData,
    expires: Date.now() + 60000
  })
  
  return dbData
}
```

## 🎯 5분 수집의 장점

### 1. 거의 실시간
- 속보 최대 5분 지연
- 경기 중 골/카드 즉시 반영
- 이적 확정 빠른 업데이트

### 2. 사용자 경험
- 항상 최신 뉴스
- 새로고침 없이도 업데이트
- 푸시 알림 가능

### 3. 경쟁력
- 대형 스포츠 사이트 수준
- 개인화 + 실시간 조합
- API 비용 대비 최고 효율

## 📈 최종 사용량 예측

### 기본 수집 (5분)
```
288회/일 × 9요청 = 2,592 요청/일
월간: 77,760 요청
```

### 집중 모드 (2-3분)
```
경기 시간 (주 20시간): 
- 20시간 × 20회/시간 × 15요청 = 6,000 요청/주
- 월간: 24,000 요청

이적 마감 (연 2회, 각 3일):
- 6일 × 288회 × 20요청 = 34,560 요청/년
- 월 평균: 2,880 요청
```

### 사용자 검색
```
일 2,000회 예상
월간: 60,000 요청
```

### 총합
```
기본: 77,760
집중: 26,880
검색: 60,000
--------------
합계: 164,640 요청/월 (0.82% 사용)
```

**여전히 1% 미만 사용!** 매우 여유롭습니다.

## 🚀 구현 단계

### 1단계: 기본 5분 수집
```typescript
// Cron Job 설정
export const newsCollectorJob = {
  schedule: '*/5 * * * *', // 5분마다
  handler: collectEnhancedNews
}
```

### 2단계: 스마트 모드
- 시간대별 차별화
- 이벤트 감지
- 동적 쿼리

### 3단계: 실시간 기능
- WebSocket 서버
- 푸시 알림
- 인스턴트 업데이트

5분 간격이면 거의 실시간 수준의 뉴스 서비스가 가능합니다!