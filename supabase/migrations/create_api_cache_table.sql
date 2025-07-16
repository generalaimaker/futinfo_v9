-- API 캐시 테이블 생성
CREATE TABLE IF NOT EXISTS api_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    endpoint TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    response JSONB NOT NULL,
    has_data BOOLEAN DEFAULT true,
    is_error BOOLEAN DEFAULT false,
    ttl INTEGER, -- seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_endpoint ON api_cache(endpoint);

-- 만료된 캐시 자동 정리 함수
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void 
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM api_cache WHERE expires_at < NOW();
END;
$$;

-- 캐시 통계 뷰
CREATE OR REPLACE VIEW api_cache_stats AS
SELECT 
    endpoint,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN has_data THEN 1 END) as entries_with_data,
    COUNT(CASE WHEN is_error THEN 1 END) as error_entries,
    AVG(ttl) as avg_ttl,
    MIN(created_at) as oldest_entry,
    MAX(created_at) as newest_entry
FROM api_cache
GROUP BY endpoint;

-- RLS 정책 (읽기 전용)
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- 서비스 역할만 쓰기 가능
CREATE POLICY "Service role can manage cache" ON api_cache
    FOR ALL USING (auth.role() = 'service_role');

-- 인증된 사용자는 읽기만 가능
CREATE POLICY "Authenticated users can read cache" ON api_cache
    FOR SELECT USING (auth.role() = 'authenticated');

-- 캐시 크기 모니터링 함수
CREATE OR REPLACE FUNCTION get_cache_size()
RETURNS TABLE(
    total_size TEXT,
    total_entries BIGINT,
    avg_entry_size TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg_size_pretty(SUM(pg_column_size(response))) as total_size,
        COUNT(*) as total_entries,
        pg_size_pretty(AVG(pg_column_size(response))::BIGINT) as avg_entry_size
    FROM api_cache;
END;
$$;