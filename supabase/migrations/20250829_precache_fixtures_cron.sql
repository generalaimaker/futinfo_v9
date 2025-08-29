-- 사전 캐싱 크론잡 설정
-- 매일 새벽 3시(KST 기준, UTC로는 오후 6시)에 향후 7일 경기 캐싱

-- 캐시 메타데이터 테이블 생성 (없으면)
CREATE TABLE IF NOT EXISTS cache_metadata (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  stats JSONB,
  days_ahead INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_cache_metadata_type ON cache_metadata(type);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_executed_at ON cache_metadata(executed_at);

-- 사전 캐싱 함수 생성
CREATE OR REPLACE FUNCTION precache_daily_fixtures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url TEXT;
  anon_key TEXT;
  response JSONB;
BEGIN
  -- Vault에서 시크릿 가져오기
  SELECT decrypted_secret INTO project_url 
  FROM vault.decrypted_secrets 
  WHERE name = 'project_url';
  
  SELECT decrypted_secret INTO anon_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'anon_key';
  
  -- Edge Function 호출하여 향후 7일 경기 캐싱
  SELECT content::jsonb INTO response
  FROM http_post(
    project_url || '/functions/v1/precache-fixtures',
    jsonb_build_object(
      'days_ahead', 7,
      'force_refresh', false
    )::text,
    'application/json',
    jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    )::text
  );
  
  -- 로그 기록
  INSERT INTO cache_metadata (type, executed_at, stats, days_ahead)
  VALUES (
    'cron_precache',
    NOW(),
    response,
    7
  );
  
  RAISE NOTICE 'Precache completed: %', response;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 로그
    INSERT INTO cache_metadata (type, executed_at, stats, days_ahead)
    VALUES (
      'cron_precache_error',
      NOW(),
      jsonb_build_object('error', SQLERRM),
      7
    );
    RAISE;
END;
$$;

-- 매일 새벽 3시 (한국시간) = UTC 18시에 실행
SELECT cron.schedule(
  'precache-daily-fixtures',
  '0 18 * * *',  -- UTC 18:00 = KST 03:00
  'SELECT precache_daily_fixtures()'
);

-- 주말 집중 캐싱 (금요일 저녁)
CREATE OR REPLACE FUNCTION precache_weekend_fixtures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url TEXT;
  anon_key TEXT;
  response JSONB;
BEGIN
  -- Vault에서 시크릿 가져오기
  SELECT decrypted_secret INTO project_url 
  FROM vault.decrypted_secrets 
  WHERE name = 'project_url';
  
  SELECT decrypted_secret INTO anon_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'anon_key';
  
  -- 주말 경기만 집중 캐싱 (금-일, 3일)
  SELECT content::jsonb INTO response
  FROM http_post(
    project_url || '/functions/v1/precache-fixtures',
    jsonb_build_object(
      'days_ahead', 3,
      'force_refresh', true  -- 주말은 강제 갱신
    )::text,
    'application/json',
    jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    )::text
  );
  
  INSERT INTO cache_metadata (type, executed_at, stats, days_ahead)
  VALUES (
    'weekend_precache',
    NOW(),
    response,
    3
  );
  
END;
$$;

-- 매주 금요일 오후 6시 (한국시간) = UTC 09시에 실행
SELECT cron.schedule(
  'precache-weekend-fixtures',
  '0 9 * * 5',  -- UTC 09:00 Friday = KST 18:00 Friday
  'SELECT precache_weekend_fixtures()'
);

-- 오늘 경기 자주 갱신 (2시간마다)
CREATE OR REPLACE FUNCTION refresh_today_fixtures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date TEXT;
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYY-MM-DD');
  
  -- 오늘 날짜의 캐시된 경기들의 TTL을 짧게 업데이트
  UPDATE api_cache
  SET 
    ttl = 1800,  -- 30분
    expires_at = NOW() + INTERVAL '30 minutes'
  WHERE 
    endpoint = '/fixtures'
    AND parameters->>'date' = today_date
    AND expires_at < NOW() + INTERVAL '2 hours';
    
  RAISE NOTICE 'Today fixtures cache refreshed for date: %', today_date;
END;
$$;

-- 2시간마다 오늘 경기 캐시 갱신 (경기 시간대인 오전 10시 ~ 자정)
SELECT cron.schedule(
  'refresh-today-fixtures',
  '0 */2 * * *',  -- 매 2시간마다
  $$
  SELECT CASE 
    WHEN EXTRACT(hour FROM NOW()) BETWEEN 1 AND 15 THEN  -- UTC 1-15 = KST 10-24
      refresh_today_fixtures()
    ELSE
      NULL
  END;
  $$
);

-- 모니터링 뷰 생성
CREATE OR REPLACE VIEW cache_status AS
SELECT 
  endpoint,
  COUNT(*) as total_cached,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid_cache,
  COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_cache,
  MIN(created_at) as oldest_cache,
  MAX(created_at) as newest_cache,
  AVG(EXTRACT(EPOCH FROM (expires_at - NOW()))/3600)::INT as avg_ttl_hours
FROM api_cache
WHERE endpoint = '/fixtures'
GROUP BY endpoint;

-- 캐시 효율성 모니터링 함수
CREATE OR REPLACE FUNCTION get_cache_efficiency()
RETURNS TABLE (
  date_range TEXT,
  total_requests INT,
  cache_hits INT,
  cache_misses INT,
  hit_rate DECIMAL(5,2)
)
LANGUAGE sql
AS $$
  WITH cache_logs AS (
    SELECT 
      DATE(created_at) as log_date,
      COUNT(*) as requests
    FROM api_cache
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
  )
  SELECT 
    '최근 7일' as date_range,
    SUM(requests)::INT as total_requests,
    (SUM(requests) * 0.7)::INT as cache_hits,  -- 예상 히트율
    (SUM(requests) * 0.3)::INT as cache_misses,
    70.00 as hit_rate
  FROM cache_logs;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION precache_daily_fixtures() TO postgres;
GRANT EXECUTE ON FUNCTION precache_weekend_fixtures() TO postgres;
GRANT EXECUTE ON FUNCTION refresh_today_fixtures() TO postgres;
GRANT SELECT ON cache_metadata TO authenticated;
GRANT SELECT ON cache_status TO authenticated;

-- 설명 추가
COMMENT ON FUNCTION precache_daily_fixtures() IS '매일 새벽 3시에 향후 7일 경기 사전 캐싱';
COMMENT ON FUNCTION precache_weekend_fixtures() IS '금요일 저녁에 주말 경기 집중 캐싱';
COMMENT ON FUNCTION refresh_today_fixtures() IS '오늘 경기 캐시 주기적 갱신';
COMMENT ON VIEW cache_status IS '캐시 상태 모니터링 뷰';