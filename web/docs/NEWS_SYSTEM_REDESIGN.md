# 뉴스 시스템 재설계 및 개선 방안

## 현재 시스템 분석

### 문제점
1. **실시간 RSS 파싱**: 매 요청마다 RSS 피드를 가져와 파싱 → 속도 저하
2. **클라이언트 번역**: 각 사용자 디바이스에서 번역 → API 비용 증가
3. **중복 처리**: 같은 뉴스를 여러 번 파싱하고 번역
4. **개인화 부족**: 사용자 선호도 반영 미흡

## 개선된 아키텍처

### 1. 데이터베이스 구조

```sql
-- 뉴스 아티클 테이블
CREATE TABLE news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 기본 정보
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT UNIQUE NOT NULL,
  source VARCHAR(100),
  source_tier INTEGER DEFAULT 2,
  trust_score INTEGER DEFAULT 50,
  
  -- 카테고리 및 태그
  category VARCHAR(50), -- general, transfer, injury, match, analysis
  tags TEXT[], -- ['Manchester United', 'Premier League', 'Transfer']
  
  -- 팀/선수 관련
  team_ids INTEGER[], -- [33, 40, 50] 관련 팀 ID들
  player_ids INTEGER[], -- 관련 선수 ID들
  league_ids INTEGER[], -- 관련 리그 ID들
  
  -- 번역 필드 (다국어 지원)
  translations JSONB DEFAULT '{}'::jsonb,
  /* 예시:
  {
    "ko": {
      "title": "맨유, 새로운 공격수 영입 임박",
      "description": "...",
      "translated_at": "2024-01-13T12:00:00Z"
    },
    "ja": {
      "title": "マンU、新たな攻撃手獲得間近",
      "description": "...",
      "translated_at": "2024-01-13T12:00:00Z"
    }
  }
  */
  
  -- 메타데이터
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 통계
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- 인덱스용
  is_featured BOOLEAN DEFAULT FALSE,
  is_breaking BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  
  CONSTRAINT unique_url UNIQUE(url)
);

-- 인덱스
CREATE INDEX idx_news_published_at ON news_articles(published_at DESC);
CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_news_team_ids ON news_articles USING GIN(team_ids);
CREATE INDEX idx_news_player_ids ON news_articles USING GIN(player_ids);
CREATE INDEX idx_news_tags ON news_articles USING GIN(tags);
CREATE INDEX idx_news_featured ON news_articles(is_featured, published_at DESC);

-- 뉴스 소스 관리
CREATE TABLE news_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  url TEXT UNIQUE NOT NULL,
  feed_type VARCHAR(20) DEFAULT 'rss', -- rss, api, scraper
  category VARCHAR(50),
  tier INTEGER DEFAULT 2,
  trust_score INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 뉴스 선호도
CREATE TABLE user_news_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 선호 설정
  preferred_teams INTEGER[],
  preferred_players INTEGER[],
  preferred_leagues INTEGER[],
  preferred_categories TEXT[],
  blocked_sources TEXT[],
  
  -- 언어 설정
  language VARCHAR(5) DEFAULT 'ko',
  auto_translate BOOLEAN DEFAULT TRUE,
  
  -- 알림 설정
  breaking_news_alert BOOLEAN DEFAULT TRUE,
  team_news_alert BOOLEAN DEFAULT TRUE,
  transfer_news_alert BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 뉴스 조회 기록
CREATE TABLE news_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_duration INTEGER, -- 초 단위
  
  UNIQUE(article_id, user_id)
);
```

### 2. Edge Functions 구조

#### 2.1 뉴스 수집 Function (`news-collector`)
```typescript
// 하루 3번 실행 (08:00, 14:00, 20:00 KST)
// Supabase Cron Job으로 스케줄링

interface CollectorConfig {
  sources: NewsSource[]
  maxArticlesPerSource: number
  deduplicationThreshold: number
}

async function collectNews() {
  // 1. 활성 소스 가져오기
  const sources = await getActiveSources()
  
  // 2. 병렬로 RSS/API 수집
  const allArticles = await Promise.all(
    sources.map(source => fetchFromSource(source))
  )
  
  // 3. 중복 제거
  const uniqueArticles = deduplicateArticles(allArticles.flat())
  
  // 4. 팀/선수 태깅
  const taggedArticles = await tagArticles(uniqueArticles)
  
  // 5. DB 저장
  await saveArticles(taggedArticles)
  
  // 6. 번역 작업 큐에 추가
  await queueTranslation(taggedArticles)
}
```

#### 2.2 번역 Function (`news-translator`)
```typescript
// 뉴스 수집 후 자동 실행
// 또는 별도 스케줄로 실행

async function translateNews() {
  // 1. 번역 필요한 기사 가져오기
  const articles = await getUntranslatedArticles()
  
  // 2. 지원 언어별 번역
  const languages = ['ko', 'ja', 'zh', 'es']
  
  for (const article of articles) {
    const translations = {}
    
    // 병렬 번역 (배치 처리)
    await Promise.all(
      languages.map(async (lang) => {
        if (lang !== 'en') {
          translations[lang] = await translateWithDeepL(article, lang)
        }
      })
    )
    
    // 3. DB 업데이트
    await updateArticleTranslations(article.id, translations)
  }
}
```

#### 2.3 맞춤 뉴스 제공 Function (`personalized-news`)
```typescript
async function getPersonalizedNews(userId: string, filters: NewsFilters) {
  // 1. 사용자 선호도 가져오기
  const preferences = await getUserPreferences(userId)
  
  // 2. 쿼리 빌드
  const query = buildQuery({
    teams: preferences.preferred_teams,
    players: preferences.preferred_players,
    categories: preferences.preferred_categories,
    language: preferences.language,
    ...filters
  })
  
  // 3. 뉴스 가져오기
  const articles = await fetchArticles(query)
  
  // 4. 스코어링 및 정렬
  const scoredArticles = articles.map(article => ({
    ...article,
    relevanceScore: calculateRelevance(article, preferences)
  }))
  
  return scoredArticles.sort((a, b) => b.relevanceScore - a.relevanceScore)
}
```

### 3. 클라이언트 구현

#### 3.1 뉴스 Hook 개선
```typescript
// lib/hooks/usePersonalizedNews.ts
export function usePersonalizedNews(filters?: NewsFilters) {
  const { user } = useAuth()
  const { language } = useUserLanguage()
  
  return useQuery({
    queryKey: ['news', 'personalized', user?.id, language, filters],
    queryFn: () => fetchPersonalizedNews({
      userId: user?.id,
      language,
      ...filters
    }),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000,
  })
}
```

#### 3.2 뉴스 카드 컴포넌트
```typescript
// components/news/NewsCard.tsx
export function NewsCard({ article }: { article: NewsArticle }) {
  const { language } = useUserLanguage()
  
  // 사용자 언어에 맞는 번역 사용
  const title = article.translations?.[language]?.title || article.title
  const description = article.translations?.[language]?.description || article.description
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {article.is_breaking && <Badge variant="destructive">속보</Badge>}
          {article.category && <Badge>{article.category}</Badge>}
          <span className="text-xs text-muted-foreground">
            {article.source} • {formatTime(article.published_at)}
          </span>
        </div>
        <h3 className="font-semibold">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        {article.team_ids?.length > 0 && (
          <div className="flex gap-2 mt-2">
            {article.team_ids.map(teamId => (
              <TeamBadge key={teamId} teamId={teamId} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 4. Cron Job 설정

```sql
-- Supabase Dashboard > SQL Editor에서 실행

-- 뉴스 수집 스케줄 (한국 시간 기준)
SELECT cron.schedule(
  'collect-news-morning',
  '0 23 * * *', -- UTC 23:00 = KST 08:00
  $$
  SELECT net.http_post(
    url := 'https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-collector',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object('time', 'morning')
  );
  $$
);

SELECT cron.schedule(
  'collect-news-afternoon',
  '0 5 * * *', -- UTC 05:00 = KST 14:00
  $$
  SELECT net.http_post(
    url := 'https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-collector',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object('time', 'afternoon')
  );
  $$
);

SELECT cron.schedule(
  'collect-news-evening',
  '0 11 * * *', -- UTC 11:00 = KST 20:00
  $$
  SELECT net.http_post(
    url := 'https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-collector',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object('time', 'evening')
  );
  $$
);

-- 오래된 뉴스 정리 (30일 이상)
SELECT cron.schedule(
  'cleanup-old-news',
  '0 0 * * 0', -- 매주 일요일 자정
  $$
  DELETE FROM news_articles 
  WHERE published_at < NOW() - INTERVAL '30 days'
    AND is_featured = FALSE;
  $$
);
```

### 5. 성능 최적화

#### 5.1 캐싱 전략
- **DB 레벨**: 자주 조회되는 뉴스는 materialized view 사용
- **Edge Function**: 5분 캐시 헤더 설정
- **클라이언트**: React Query로 캐싱 및 background refetch

#### 5.2 번역 최적화
- **배치 처리**: 여러 기사를 한 번에 번역
- **우선순위**: 주요 뉴스부터 번역
- **재사용**: 유사한 문장은 캐시에서 재사용

#### 5.3 이미지 최적화
- **CDN 사용**: Supabase Storage + CDN
- **썸네일 생성**: 다양한 크기 미리 생성
- **Lazy Loading**: 뷰포트에 들어올 때 로드

### 6. 구현 우선순위

1. **Phase 1** (1주차)
   - [ ] DB 테이블 생성
   - [ ] 기본 뉴스 수집 Function
   - [ ] 수동 실행 테스트

2. **Phase 2** (2주차)
   - [ ] 번역 시스템 구현
   - [ ] Cron Job 설정
   - [ ] 기본 API 엔드포인트

3. **Phase 3** (3주차)
   - [ ] 사용자 맞춤 필터링
   - [ ] 팀/선수 태깅
   - [ ] 클라이언트 UI 업데이트

4. **Phase 4** (4주차)
   - [ ] 성능 최적화
   - [ ] 모니터링 설정
   - [ ] 관리자 대시보드

## 예상 효과

### 성능 개선
- **응답 속도**: 5초 → 0.5초 (10배 개선)
- **API 비용**: 70% 절감 (서버 번역 + 캐싱)
- **사용자 경험**: 맞춤형 콘텐츠로 참여도 증가

### 확장성
- **다국어 지원**: 5개 언어 동시 지원
- **소스 확장**: RSS 외 API, 웹 스크래핑 추가 가능
- **AI 큐레이션**: GPT를 활용한 뉴스 요약 및 분석

### 데이터 활용
- **사용자 행동 분석**: 인기 뉴스, 선호 카테고리 파악
- **트렌드 분석**: 이적 시장 동향, 팀별 이슈 파악
- **개인화 강화**: 머신러닝으로 추천 정확도 향상