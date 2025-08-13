# 뉴스 시스템 구조 점검 보고서

## 📊 현재 구조 분석

### 1. 데이터베이스 테이블 구조

#### ✅ 장점
- **news_articles**: 
  - 10개의 인덱스로 최적화 (published_at, category, team_ids, importance_score 등)
  - URL 중복 방지 (UNIQUE 제약)
  - GIN 인덱스로 배열 검색 최적화 (team_ids, player_ids, tags)
  
- **관련 테이블**:
  - `api_usage`: API 사용량 추적
  - `collection_logs`: 수집 통계
  - `news_views`: 조회수 추적
  - `user_news_preferences`: 개인화 설정
  - `popular_news`: VIEW로 인기 뉴스 자동 계산

#### ⚠️ 문제점
1. **created_at 컬럼 누락**: news_articles에 created_at이 없음 (collected_at, updated_at만 존재)
2. **트리거 부재**: updated_at 자동 갱신 트리거 없음
3. **파티셔닝 없음**: 대용량 데이터 대비 파티셔닝 미적용

### 2. RLS (Row Level Security) 정책

#### ✅ 장점
- news_articles: 모든 사용자 읽기 가능 (공개 데이터)
- user_news_preferences: 본인 데이터만 관리 가능
- news_views: 본인 조회 기록만 관리

#### ⚠️ 문제점
1. **api_usage 보호 없음**: RLS 정책 미적용
2. **collection_logs 보호 없음**: 민감한 수집 로그 노출 위험
3. **news_articles INSERT/UPDATE 제한 없음**: 악의적 데이터 삽입 가능

### 3. Edge Functions 구조

#### ✅ 장점
- `news-collector-enhanced`: 시간대별 동적 수집
- `brave-news-search`: 실시간 검색 지원
- CORS 헤더 적절히 설정

#### ⚠️ 문제점
1. **에러 처리 미흡**: try-catch만으로 부족
2. **레이트 리미팅 없음**: API 남용 방지 장치 없음
3. **환경변수 폴백**: API 키 하드코딩 위험

## 🔧 개선 필요 사항

### 1. 긴급 수정 (Critical)

```sql
-- 1. created_at 컬럼 추가
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_news_articles_updated_at 
BEFORE UPDATE ON news_articles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. RLS 정책 강화
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
CREATE POLICY "Only service role can manage api_usage" ON api_usage
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can manage collection_logs" ON collection_logs
FOR ALL USING (auth.role() = 'service_role');

-- news_articles INSERT/UPDATE 제한
CREATE POLICY "Only service role can insert news" ON news_articles
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update news" ON news_articles
FOR UPDATE USING (auth.role() = 'service_role');
```

### 2. 성능 최적화 (High Priority)

```sql
-- 1. 파티셔닝 (월별)
CREATE TABLE news_articles_2024_01 PARTITION OF news_articles
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 2. 뷰 구체화 (Materialized View)
CREATE MATERIALIZED VIEW mv_popular_news AS
SELECT * FROM popular_news
WITH DATA;

CREATE UNIQUE INDEX ON mv_popular_news(id);

-- 3시간마다 갱신
CREATE OR REPLACE FUNCTION refresh_popular_news()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_news;
END;
$$ LANGUAGE plpgsql;

-- 3. 복합 인덱스 추가
CREATE INDEX idx_news_hot_articles ON news_articles(
  is_breaking DESC, 
  importance_score DESC, 
  published_at DESC
) WHERE is_breaking = true OR importance_score > 80;
```

### 3. 안정성 개선 (Medium Priority)

```typescript
// Edge Function 개선
const rateLimiter = new Map<string, number>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const lastCall = rateLimiter.get(ip) || 0
  
  if (now - lastCall < 1000) { // 1초 제한
    return false
  }
  
  rateLimiter.set(ip, now)
  return true
}

// 재시도 로직
async function retryableSearch(query: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await searchBraveForNews(query)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

// 데이터 검증
function validateArticle(article: any): boolean {
  return !!(
    article.title && 
    article.url && 
    article.title.length < 500 &&
    article.url.startsWith('http')
  )
}
```

### 4. 모니터링 추가 (Low Priority)

```sql
-- 1. 수집 성능 모니터링
CREATE OR REPLACE VIEW v_collection_stats AS
SELECT 
  DATE(collected_at) as date,
  COUNT(*) as collections,
  AVG(total_articles) as avg_total,
  AVG(unique_articles) as avg_unique,
  AVG(saved_articles) as avg_saved,
  SUM(api_calls) as total_api_calls
FROM collection_logs
GROUP BY DATE(collected_at)
ORDER BY date DESC;

-- 2. API 사용량 대시보드
CREATE OR REPLACE VIEW v_api_usage_dashboard AS
SELECT 
  api_name,
  usage_date,
  request_count,
  CASE 
    WHEN api_name = 'brave_search' THEN 
      ROUND(request_count::numeric / 20000000 * 100, 2)
    ELSE 0
  END as usage_percentage
FROM api_usage
WHERE usage_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY usage_date DESC, api_name;

-- 3. 뉴스 품질 모니터링
CREATE OR REPLACE VIEW v_news_quality AS
SELECT 
  DATE(published_at) as date,
  source,
  COUNT(*) as article_count,
  AVG(trust_score) as avg_trust_score,
  AVG(importance_score) as avg_importance,
  COUNT(CASE WHEN is_breaking THEN 1 END) as breaking_count
FROM news_articles
WHERE published_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(published_at), source
ORDER BY date DESC, article_count DESC;
```

## 🛡️ 보안 체크리스트

### ✅ 현재 적용됨
- [x] RLS 기본 활성화
- [x] 사용자별 preferences 격리
- [x] URL 중복 방지

### ⚠️ 추가 필요
- [ ] API 키 환경변수 관리
- [ ] Rate Limiting 구현
- [ ] 입력 데이터 검증 강화
- [ ] SQL Injection 방지
- [ ] XSS 방지 (HTML 새니타이징)
- [ ] CORS 세밀한 설정
- [ ] 로깅 및 감사 추적

## 📈 성능 메트릭

### 현재 예상 성능
- **쿼리 응답**: 50-200ms (인덱스 적용)
- **수집 주기**: 5분
- **일일 처리량**: ~30,000 articles
- **API 사용률**: 0.99% (월 198,720 / 20,000,000)

### 병목 지점
1. **translations JSONB**: 대용량 시 성능 저하 가능
2. **GIN 인덱스**: 쓰기 성능 영향
3. **중복 체크**: O(n) 복잡도

## 🎯 권장 우선순위

### 즉시 적용 (Today)
1. ✅ created_at 컬럼 추가
2. ✅ updated_at 트리거
3. ✅ RLS 정책 강화

### 1주일 내
1. Rate Limiting
2. 입력 검증
3. 에러 처리 개선

### 1개월 내
1. 파티셔닝
2. Materialized Views
3. 모니터링 대시보드

## 📝 결론

### 전체 평점: B+ (75/100)

#### 강점
- 기본 구조 견고함
- 인덱스 전략 우수
- 개인화 시스템 완비

#### 약점
- 보안 정책 미흡
- 대용량 대비 부족
- 모니터링 부재

#### 종합 평가
현재 소규모~중규모 서비스에는 충분하나, 대규모 확장 시 성능 최적화와 보안 강화가 필요합니다. 특히 RLS 정책과 Rate Limiting은 즉시 적용이 권장됩니다.