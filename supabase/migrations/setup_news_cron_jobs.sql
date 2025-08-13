-- Cron Job 설정을 위한 SQL
-- Supabase Dashboard > SQL Editor에서 실행

-- pg_cron extension 활성화 (이미 활성화되어 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 크론 잡 스키마에 권한 부여
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 뉴스 수집 스케줄 (한국 시간 기준)
-- 아침 8시 (UTC 23:00 = KST 08:00)
SELECT cron.schedule(
  'collect-news-morning',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-collector',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'time', 'morning',
      'timestamp', NOW()
    )
  );
  $$
);

-- 오후 2시 (UTC 05:00 = KST 14:00)
SELECT cron.schedule(
  'collect-news-afternoon',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-collector',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'time', 'afternoon',
      'timestamp', NOW()
    )
  );
  $$
);

-- 저녁 8시 (UTC 11:00 = KST 20:00)
SELECT cron.schedule(
  'collect-news-evening',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-collector',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'time', 'evening',
      'timestamp', NOW()
    )
  );
  $$
);

-- 번역 작업 스케줄 (뉴스 수집 30분 후)
-- 아침 번역 (UTC 23:30 = KST 08:30)
SELECT cron.schedule(
  'translate-news-morning',
  '30 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-translator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'priority', 'high',
      'languages', ARRAY['ko', 'ja', 'zh', 'es']
    )
  );
  $$
);

-- 오후 번역 (UTC 05:30 = KST 14:30)
SELECT cron.schedule(
  'translate-news-afternoon',
  '30 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-translator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'priority', 'normal',
      'languages', ARRAY['ko', 'ja', 'zh', 'es']
    )
  );
  $$
);

-- 저녁 번역 (UTC 11:30 = KST 20:30)
SELECT cron.schedule(
  'translate-news-evening',
  '30 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-translator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'priority', 'normal',
      'languages', ARRAY['ko', 'ja', 'zh', 'es']
    )
  );
  $$
);

-- 오래된 뉴스 정리 (매주 일요일 자정 UTC)
SELECT cron.schedule(
  'cleanup-old-news',
  '0 0 * * 0',
  $$
  DELETE FROM news_articles 
  WHERE published_at < NOW() - INTERVAL '30 days'
    AND is_featured = FALSE
    AND view_count < 100;
  $$
);

-- 인기 뉴스 업데이트 (매일 자정 UTC)
SELECT cron.schedule(
  'update-featured-news',
  '0 0 * * *',
  $$
  -- 기존 featured 해제
  UPDATE news_articles 
  SET is_featured = FALSE 
  WHERE is_featured = TRUE;
  
  -- 최근 24시간 인기 뉴스 featured 설정
  UPDATE news_articles 
  SET is_featured = TRUE 
  WHERE id IN (
    SELECT id 
    FROM news_articles 
    WHERE published_at > NOW() - INTERVAL '24 hours'
    ORDER BY view_count DESC, trust_score DESC 
    LIMIT 5
  );
  $$
);

-- 크론 잡 목록 확인
SELECT * FROM cron.job;