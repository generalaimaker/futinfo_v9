# 축구 뉴스 시스템 아키텍처

## 개요
RSS 피드 기반의 자동화된 뉴스 수집 및 번역 시스템

## 핵심 기술 스택

### API 및 서비스
- **RSS Feeds**: 뉴스 수집 (주요 스포츠 미디어 RSS 피드)
- **Azure Translator API**: 다국어 번역
- **Supabase**: 데이터베이스 및 Edge Functions
- **PostgreSQL Cron (pg_cron)**: 자동화 스케줄링

### 프론트엔드
- **Next.js 14.2.30**: React 프레임워크
- **React Query**: 데이터 페칭 및 캐싱 (5분 자동 새로고침)
- **TypeScript**: 타입 안정성

## 시스템 구조

### 1. 데이터베이스 스키마

```sql
-- 뉴스 기사 테이블
CREATE TABLE news_articles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE NOT NULL,
  source TEXT,
  source_tier INTEGER DEFAULT 3,
  trust_score DECIMAL DEFAULT 0.5,
  category TEXT DEFAULT 'general',
  tags TEXT[],
  team_ids INTEGER[],
  player_ids INTEGER[],
  league_ids INTEGER[],
  translations JSONB DEFAULT '{}',
  image_url TEXT,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_breaking BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 언어 설정
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  language TEXT DEFAULT 'ko',
  news_language TEXT DEFAULT 'ko',
  news_categories TEXT[] DEFAULT ARRAY['general', 'transfer', 'injury'],
  -- ... 기타 설정
);
```

### 2. Edge Functions

#### `/supabase/functions/news-collector-enhanced/`
- **목적**: RSS 피드를 통한 뉴스 수집
- **실행 주기**: 5분마다 (Cron)
- **주요 기능**:
  - RSS 피드에서 뉴스 수집
  - 중복 제거 및 우선순위 설정
  - 메타데이터 추출 (팀, 리그, 카테고리)
  - 배치 처리로 효율성 최적화

```typescript
const PRIORITY_TEAMS = {
  premier: ['Manchester United', 'Liverpool', 'Manchester City', ...],
  laliga: ['Real Madrid', 'Barcelona', 'Atletico Madrid', ...],
  seriea: ['Juventus', 'Inter Milan', 'AC Milan', ...],
  bundesliga: ['Bayern Munich', 'Borussia Dortmund', ...],
  ligue1: ['PSG', 'Monaco', ...]
}
```

#### `/supabase/functions/news-translator/`
- **목적**: Azure Translator API를 통한 다국어 번역
- **실행 주기**: 10분마다 (Cron)
- **지원 언어**: 한국어, 일본어, 중국어, 스페인어, 독일어, 프랑스어
- **주요 기능**:
  - 배치 번역 (10개씩 병렬 처리)
  - 기존 번역 스킵으로 API 최적화
  - 번역 결과 JSONB 형태로 저장

### 3. Cron Jobs 설정

```sql
-- 뉴스 수집 (5분마다)
SELECT cron.schedule(
  'collect-news-every-5-minutes',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    'https://[project-id].supabase.co/functions/v1/news-collector-enhanced',
    headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb
  );
  $$
);

-- 번역 처리 (10분마다)
SELECT cron.schedule(
  'translate-news-every-10-minutes',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    'https://[project-id].supabase.co/functions/v1/news-translator',
    headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb
  );
  $$
);
```

### 4. 프론트엔드 구현

#### 데이터 페칭 (`/web/lib/supabase/cached-news.ts`)
```typescript
// React Query Hook - 개인화된 뉴스
export function usePersonalizedNews(filters: NewsFilters = {}) {
  return useQuery({
    queryKey: ['news', 'personalized', filters, getUserLanguage()],
    queryFn: () => fetchPersonalizedNews(filters),
    staleTime: 2 * 60 * 1000, // 2분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
  })
}
```

#### 홈페이지 뉴스 섹션 (`/web/components/home/NewsSection.tsx`)
- 실시간 데이터 표시
- 사용자 언어 설정에 따른 번역 표시
- 간결한 리스트 UI (탭 및 트렌드 섹션 제거)

## 데이터 흐름

1. **수집 단계** (5분마다)
   - Brave Search API 호출 → 뉴스 수집
   - 중복 확인 및 필터링
   - PostgreSQL 저장

2. **번역 단계** (10분마다)
   - 미번역 기사 조회
   - DeepL API 배치 번역
   - translations JSONB 필드 업데이트

3. **클라이언트 표시**
   - React Query로 데이터 페칭
   - 사용자 언어 설정 확인
   - 번역된 콘텐츠 우선 표시

## 성능 최적화

- **API 효율성**: 배치 처리 및 병렬 요청
- **캐싱 전략**: React Query 5분 캐시
- **중복 방지**: URL 기반 unique constraint
- **번역 최적화**: 기존 번역 스킵

## 보안 및 권한

- **RLS (Row Level Security)**: 사용자별 선호도 보호
- **Service Role Key**: Edge Functions용 별도 키
- **CORS 설정**: 모든 Edge Function에 적용

## 현재 상태

- ✅ 629개 뉴스 기사 수집 완료
- ✅ 106개 기사 한국어 번역 완료
- ✅ 자동화 Cron Jobs 활성화
- ✅ 홈페이지 실시간 데이터 표시
- ✅ UI 단순화 완료

## 향후 개선 사항

1. 뉴스 신뢰도 점수 고도화
2. 사용자 관심사 기반 추천 알고리즘
3. 이미지 최적화 및 CDN 적용
4. 번역 품질 향상 (컨텍스트 기반)
5. 실시간 알림 시스템 구현