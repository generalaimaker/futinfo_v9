-- 뉴스 기사 테이블
CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source_name TEXT NOT NULL,
  source_tier TEXT NOT NULL,
  trust_score INTEGER NOT NULL DEFAULT 50,
  url TEXT UNIQUE NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  cluster_id TEXT,
  duplicate_count INTEGER DEFAULT 0,
  duplicate_sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX idx_news_articles_category ON news_articles(category);
CREATE INDEX idx_news_articles_cluster_id ON news_articles(cluster_id);
CREATE INDEX idx_news_articles_created_at ON news_articles(created_at DESC);

-- 뉴스 업데이트 알림 테이블 (실시간)
CREATE TABLE IF NOT EXISTS news_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  count INTEGER,
  category TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 뉴스 캐시 테이블 (빠른 응답)
CREATE TABLE IF NOT EXISTS news_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 성능 메트릭 테이블
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  news_load_time REAL,
  cache_hit_rate REAL,
  error_rate REAL,
  articles_read INTEGER,
  sources_viewed INTEGER,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 설정
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- 뉴스 읽기 정책 (모든 사용자)
CREATE POLICY "Anyone can read news" ON news_articles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read updates" ON news_updates
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read cache" ON news_cache
  FOR SELECT USING (true);

-- 서비스 역할만 쓰기 가능
CREATE POLICY "Service role can insert news" ON news_articles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update news" ON news_articles
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage cache" ON news_cache
  FOR ALL USING (auth.role() = 'service_role');

-- 뉴스 조회 함수 (페이징, 필터링)
CREATE OR REPLACE FUNCTION get_news(
  p_category TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  summary TEXT,
  source JSONB,
  published_at TIMESTAMPTZ,
  category TEXT,
  cluster JSONB,
  url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.summary,
    jsonb_build_object(
      'name', n.source_name,
      'tier', n.source_tier,
      'reliability', n.trust_score
    ) as source,
    n.published_at,
    n.category,
    CASE 
      WHEN n.duplicate_count > 0 THEN
        jsonb_build_object(
          'count', n.duplicate_count,
          'sources', n.duplicate_sources
        )
      ELSE NULL
    END as cluster,
    n.url
  FROM news_articles n
  WHERE (p_category IS NULL OR n.category = p_category)
  ORDER BY n.published_at DESC
  LIMIT p_limit
  OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql;

-- 캐시 관리 함수
CREATE OR REPLACE FUNCTION get_or_set_cache(
  p_key TEXT,
  p_data JSONB DEFAULT NULL,
  p_ttl_seconds INTEGER DEFAULT 300
)
RETURNS JSONB AS $$
DECLARE
  v_cached JSONB;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- 캐시 확인
  SELECT data INTO v_cached
  FROM news_cache
  WHERE cache_key = p_key
    AND expires_at > NOW();
  
  IF v_cached IS NOT NULL THEN
    RETURN v_cached;
  END IF;
  
  -- 캐시 미스 또는 만료
  IF p_data IS NOT NULL THEN
    v_expires_at := NOW() + (p_ttl_seconds || ' seconds')::INTERVAL;
    
    INSERT INTO news_cache (cache_key, data, expires_at)
    VALUES (p_key, p_data, v_expires_at)
    ON CONFLICT (cache_key) DO UPDATE
    SET data = p_data,
        expires_at = v_expires_at,
        created_at = NOW();
    
    RETURN p_data;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 오래된 캐시 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM news_cache WHERE expires_at < NOW();
  DELETE FROM news_updates WHERE timestamp < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 정기적인 캐시 정리를 위한 크론 작업 (pg_cron 필요)
-- SELECT cron.schedule('cleanup-cache', '*/10 * * * *', 'SELECT cleanup_expired_cache();');