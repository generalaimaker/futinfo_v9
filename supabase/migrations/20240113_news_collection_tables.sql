-- 뉴스 수집 로그 테이블
CREATE TABLE IF NOT EXISTS collection_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  total_articles INTEGER,
  unique_articles INTEGER,
  saved_articles INTEGER,
  breaking_news INTEGER,
  api_calls INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 에러 로그 테이블
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT,
  error_message TEXT,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- news_articles 테이블 개선 (없으면 생성)
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE NOT NULL,
  source TEXT,
  category TEXT,
  team_ids INTEGER[],
  tags TEXT[],
  image_url TEXT,
  published_at TIMESTAMPTZ,
  importance_score INTEGER DEFAULT 0,
  is_breaking BOOLEAN DEFAULT FALSE,
  is_from_search BOOLEAN DEFAULT FALSE,
  translations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_team_ids ON news_articles USING GIN(team_ids);
CREATE INDEX IF NOT EXISTS idx_news_articles_importance_score ON news_articles(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_is_breaking ON news_articles(is_breaking);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at ON news_articles(created_at DESC);

-- API 사용량 추적 함수
CREATE OR REPLACE FUNCTION track_api_usage(
  api_name TEXT,
  count INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO api_usage (api_name, usage_date, request_count)
  VALUES (api_name, CURRENT_DATE, count)
  ON CONFLICT (api_name, usage_date)
  DO UPDATE SET request_count = api_usage.request_count + EXCLUDED.request_count;
END;
$$ LANGUAGE plpgsql;

-- 중복 뉴스 체크 함수
CREATE OR REPLACE FUNCTION check_duplicate_news(
  p_url TEXT,
  p_title TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- URL 완전 일치 체크
  SELECT EXISTS(
    SELECT 1 FROM news_articles WHERE url = p_url
  ) INTO v_exists;
  
  IF v_exists THEN
    RETURN TRUE;
  END IF;
  
  -- 제목 유사도 체크 (80% 이상)
  SELECT EXISTS(
    SELECT 1 FROM news_articles 
    WHERE similarity(title, p_title) > 0.8
    AND created_at > NOW() - INTERVAL '24 hours'
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- pg_trgm 확장 활성화 (유사도 검색용)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 뉴스 정리 함수 (오래된 뉴스 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_news() RETURNS VOID AS $$
BEGIN
  -- 7일 이상 된 일반 뉴스 삭제
  DELETE FROM news_articles 
  WHERE created_at < NOW() - INTERVAL '7 days'
  AND is_breaking = FALSE
  AND importance_score < 100;
  
  -- 30일 이상 된 모든 뉴스 삭제
  DELETE FROM news_articles 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Cron Job 설정 (Supabase Dashboard에서 설정)
-- 5분마다 뉴스 수집: */5 * * * *
-- 매일 자정 정리: 0 0 * * *