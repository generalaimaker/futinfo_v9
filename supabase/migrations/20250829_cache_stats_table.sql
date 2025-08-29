-- 캐시 통계 테이블 생성
CREATE TABLE IF NOT EXISTS cache_stats (
  id BIGSERIAL PRIMARY KEY,
  cache_key TEXT NOT NULL,
  hit_type TEXT NOT NULL CHECK (hit_type IN ('hit', 'miss', 'stale')),
  endpoint TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_cache_stats_timestamp ON cache_stats(timestamp);
CREATE INDEX IF NOT EXISTS idx_cache_stats_cache_key ON cache_stats(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_stats_hit_type ON cache_stats(hit_type);

-- 통계 집계 뷰
CREATE OR REPLACE VIEW cache_performance AS
WITH hourly_stats AS (
  SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN hit_type = 'hit' THEN 1 END) as cache_hits,
    COUNT(CASE WHEN hit_type = 'miss' THEN 1 END) as cache_misses,
    COUNT(CASE WHEN hit_type = 'stale' THEN 1 END) as stale_hits,
    AVG(response_time_ms) as avg_response_time
  FROM cache_stats
  WHERE timestamp > NOW() - INTERVAL '24 hours'
  GROUP BY DATE_TRUNC('hour', timestamp)
)
SELECT 
  hour,
  total_requests,
  cache_hits,
  cache_misses,
  stale_hits,
  CASE 
    WHEN total_requests > 0 
    THEN ROUND((cache_hits::DECIMAL / total_requests) * 100, 2)
    ELSE 0 
  END as hit_rate,
  avg_response_time
FROM hourly_stats
ORDER BY hour DESC;

-- 리그별 캐시 현황 뷰
CREATE OR REPLACE VIEW league_cache_status AS
SELECT 
  parameters->>'league' as league_id,
  COUNT(*) as total_cached,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid_cache,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_cache,
  COUNT(DISTINCT parameters->>'date') as unique_dates,
  MIN(parameters->>'date') as earliest_date,
  MAX(parameters->>'date') as latest_date,
  AVG(ttl)::INT as avg_ttl_seconds
FROM api_cache
WHERE endpoint = '/fixtures'
AND parameters->>'league' IS NOT NULL
GROUP BY parameters->>'league'
ORDER BY total_cached DESC;

-- 캐시 효율성 대시보드 함수
CREATE OR REPLACE FUNCTION get_cache_dashboard()
RETURNS TABLE (
  metric TEXT,
  value TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_cache_size TEXT;
  v_hit_rate DECIMAL;
  v_total_requests INTEGER;
  v_avg_response_time DECIMAL;
BEGIN
  -- 전체 캐시 크기
  SELECT pg_size_pretty(pg_total_relation_size('api_cache'))
  INTO v_total_cache_size;
  
  -- 24시간 히트율
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(CASE WHEN hit_type = 'hit' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0 
    END
  INTO v_hit_rate
  FROM cache_stats
  WHERE timestamp > NOW() - INTERVAL '24 hours';
  
  -- 24시간 총 요청 수
  SELECT COUNT(*)
  INTO v_total_requests
  FROM cache_stats
  WHERE timestamp > NOW() - INTERVAL '24 hours';
  
  -- 평균 응답 시간
  SELECT AVG(response_time_ms)
  INTO v_avg_response_time
  FROM cache_stats
  WHERE timestamp > NOW() - INTERVAL '24 hours';
  
  RETURN QUERY
  SELECT 'Total Cache Size', v_total_cache_size
  UNION ALL
  SELECT '24h Hit Rate', v_hit_rate || '%'
  UNION ALL
  SELECT '24h Total Requests', v_total_requests::TEXT
  UNION ALL
  SELECT 'Avg Response Time', COALESCE(ROUND(v_avg_response_time, 2)::TEXT, '0') || 'ms'
  UNION ALL
  SELECT 'Valid Cache Entries', (
    SELECT COUNT(*)::TEXT 
    FROM api_cache 
    WHERE expires_at > NOW()
  )
  UNION ALL
  SELECT 'Expired Cache Entries', (
    SELECT COUNT(*)::TEXT 
    FROM api_cache 
    WHERE expires_at <= NOW()
  );
END;
$$;

-- 권한 부여
GRANT SELECT, INSERT ON cache_stats TO authenticated;
GRANT SELECT ON cache_performance TO authenticated;
GRANT SELECT ON league_cache_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_dashboard() TO authenticated;

-- 코멘트
COMMENT ON TABLE cache_stats IS '캐시 히트/미스 통계 기록';
COMMENT ON VIEW cache_performance IS '시간별 캐시 성능 통계';
COMMENT ON VIEW league_cache_status IS '리그별 캐시 현황';
COMMENT ON FUNCTION get_cache_dashboard() IS '캐시 대시보드 통계';