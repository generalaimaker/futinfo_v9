-- cached_news 테이블 생성
CREATE TABLE IF NOT EXISTS cached_news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    image_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 번역된 콘텐츠 (서버에서 미리 번역)
    title_ko TEXT,
    title_ja TEXT,
    title_zh TEXT,
    title_es TEXT,
    summary_ko TEXT,
    summary_ja TEXT,
    summary_zh TEXT,
    summary_es TEXT,
    
    -- 메타데이터
    category TEXT DEFAULT 'general',
    importance TEXT DEFAULT 'normal',
    tags TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    
    -- 인덱스용
    search_vector tsvector
);

-- 인덱스 생성
CREATE INDEX idx_cached_news_published_at ON cached_news(published_at DESC);
CREATE INDEX idx_cached_news_source ON cached_news(source);
CREATE INDEX idx_cached_news_url ON cached_news(url);
CREATE INDEX idx_cached_news_search ON cached_news USING GIN(search_vector);

-- 검색 벡터 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.source, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_vector_trigger
BEFORE INSERT OR UPDATE ON cached_news
FOR EACH ROW
EXECUTE FUNCTION update_search_vector();

-- RLS 정책 설정 (읽기 전용)
ALTER TABLE cached_news ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있음
CREATE POLICY "Allow public read access" ON cached_news
    FOR SELECT
    USING (true);

-- 서비스 역할만 삽입/업데이트/삭제 가능
CREATE POLICY "Service role only write" ON cached_news
    FOR ALL
    USING (auth.role() = 'service_role');

-- 뷰 카운트 증가 함수
CREATE OR REPLACE FUNCTION increment_view_count(news_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE cached_news 
    SET view_count = view_count + 1
    WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- 인기 뉴스 뷰
CREATE OR REPLACE VIEW popular_news AS
SELECT 
    id,
    title,
    summary,
    url,
    source,
    image_url,
    published_at,
    category,
    importance,
    tags,
    view_count,
    title_ko,
    summary_ko
FROM cached_news
WHERE published_at > NOW() - INTERVAL '7 days'
ORDER BY view_count DESC, published_at DESC
LIMIT 20;

-- 최신 뉴스 뷰
CREATE OR REPLACE VIEW latest_news AS
SELECT 
    id,
    title,
    summary,
    url,
    source,
    image_url,
    published_at,
    category,
    importance,
    tags,
    view_count,
    title_ko,
    summary_ko
FROM cached_news
WHERE published_at > NOW() - INTERVAL '24 hours'
ORDER BY published_at DESC
LIMIT 50;

-- 리그별 뉴스 함수
CREATE OR REPLACE FUNCTION get_news_by_league(league_name TEXT)
RETURNS TABLE(
    id INTEGER,
    title TEXT,
    summary TEXT,
    url TEXT,
    source TEXT,
    image_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    title_ko TEXT,
    summary_ko TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cn.id,
        cn.title,
        cn.summary,
        cn.url,
        cn.source,
        cn.image_url,
        cn.published_at,
        cn.title_ko,
        cn.summary_ko
    FROM cached_news cn
    WHERE 
        cn.published_at > NOW() - INTERVAL '7 days'
        AND (
            league_name = 'all' OR
            cn.search_vector @@ plainto_tsquery('english', league_name) OR
            cn.title ILIKE '%' || league_name || '%' OR
            cn.summary ILIKE '%' || league_name || '%'
        )
    ORDER BY cn.published_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- 통계 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS news_statistics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_collected INTEGER DEFAULT 0,
    by_source JSONB DEFAULT '{}',
    by_category JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);