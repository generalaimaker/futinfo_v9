-- 실시간 업데이트 성능 모니터링 쿼리

-- 1. Realtime 채널 연결 상태 확인
CREATE OR REPLACE VIEW realtime_channel_metrics AS
SELECT 
    channel_name,
    count(distinct user_id) as connected_users,
    count(*) as total_connections,
    max(connected_at) as latest_connection,
    avg(extract(epoch from (now() - connected_at))) as avg_connection_duration_seconds
FROM realtime.connections
WHERE disconnected_at IS NULL
GROUP BY channel_name;

-- 2. 실시간 업데이트 지연 시간 측정
CREATE OR REPLACE FUNCTION get_realtime_latency()
RETURNS TABLE (
    update_type text,
    avg_latency_ms numeric,
    max_latency_ms numeric,
    update_count bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH update_logs AS (
        SELECT 
            'live_match' as update_type,
            last_updated as update_time,
            created_at as log_time
        FROM live_matches
        WHERE last_updated > now() - interval '1 hour'
        
        UNION ALL
        
        SELECT 
            'match_event' as update_type,
            created_at as update_time,
            created_at as log_time
        FROM live_match_events
        WHERE created_at > now() - interval '1 hour'
    )
    SELECT 
        update_type,
        round(avg(extract(milliseconds from (log_time - update_time))), 2) as avg_latency_ms,
        round(max(extract(milliseconds from (log_time - update_time))), 2) as max_latency_ms,
        count(*) as update_count
    FROM update_logs
    GROUP BY update_type;
END;
$$ LANGUAGE plpgsql;

-- 3. 크론 작업 성능 메트릭
CREATE OR REPLACE FUNCTION get_cron_performance_metrics()
RETURNS TABLE (
    job_name text,
    total_runs bigint,
    successful_runs bigint,
    failed_runs bigint,
    success_rate numeric,
    avg_duration_seconds numeric,
    max_duration_seconds numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.jobname,
        count(*) as total_runs,
        count(*) filter (where status = 'succeeded') as successful_runs,
        count(*) filter (where status = 'failed') as failed_runs,
        round(100.0 * count(*) filter (where status = 'succeeded') / count(*), 2) as success_rate,
        round(avg(extract(epoch from (end_time - start_time))), 2) as avg_duration_seconds,
        round(max(extract(epoch from (end_time - start_time))), 2) as max_duration_seconds
    FROM cron.job j
    JOIN cron.job_run_details d ON j.jobid = d.jobid
    WHERE d.start_time > now() - interval '24 hours'
    GROUP BY j.jobname
    ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql;

-- 4. API 요청 응답 시간 분석
CREATE OR REPLACE FUNCTION get_api_response_metrics()
RETURNS TABLE (
    hour_bucket timestamp,
    total_requests bigint,
    avg_response_time_ms numeric,
    p95_response_time_ms numeric,
    p99_response_time_ms numeric,
    success_rate numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH response_times AS (
        SELECT 
            date_trunc('hour', created) as hour_bucket,
            status_code,
            extract(milliseconds from (created - (created - interval '1 second'))) as response_time_ms
        FROM net._http_response
        WHERE created > now() - interval '24 hours'
    )
    SELECT 
        hour_bucket,
        count(*) as total_requests,
        round(avg(response_time_ms), 2) as avg_response_time_ms,
        round(percentile_cont(0.95) within group (order by response_time_ms), 2) as p95_response_time_ms,
        round(percentile_cont(0.99) within group (order by response_time_ms), 2) as p99_response_time_ms,
        round(100.0 * count(*) filter (where status_code = 200) / count(*), 2) as success_rate
    FROM response_times
    GROUP BY hour_bucket
    ORDER BY hour_bucket DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. 실시간 업데이트 부하 분석
CREATE OR REPLACE FUNCTION analyze_realtime_load()
RETURNS TABLE (
    metric_name text,
    metric_value numeric,
    metric_unit text
) AS $$
BEGIN
    RETURN QUERY
    -- 현재 활성 라이브 경기 수
    SELECT 
        'active_live_matches'::text,
        count(*)::numeric,
        'matches'::text
    FROM live_matches
    
    UNION ALL
    
    -- 분당 업데이트 수
    SELECT 
        'updates_per_minute'::text,
        count(*)::numeric / 60,
        'updates/min'::text
    FROM live_matches
    WHERE last_updated > now() - interval '1 hour'
    
    UNION ALL
    
    -- 평균 경기당 이벤트 수
    SELECT 
        'avg_events_per_match'::text,
        round(avg(event_count), 2),
        'events'::text
    FROM (
        SELECT fixture_id, count(*) as event_count
        FROM live_match_events
        GROUP BY fixture_id
    ) t
    
    UNION ALL
    
    -- 데이터베이스 연결 수
    SELECT 
        'database_connections'::text,
        count(*)::numeric,
        'connections'::text
    FROM pg_stat_activity
    WHERE state = 'active';
END;
$$ LANGUAGE plpgsql;

-- 6. 클라이언트별 실시간 업데이트 수신 지연
CREATE OR REPLACE VIEW client_realtime_metrics AS
SELECT 
    client_type,
    avg(latency_ms) as avg_latency_ms,
    max(latency_ms) as max_latency_ms,
    count(*) as update_count,
    count(distinct client_id) as unique_clients
FROM (
    -- 이 부분은 실제 클라이언트 로그 데이터가 필요
    SELECT 
        'web' as client_type,
        100 + random() * 50 as latency_ms,
        'client_' || generate_series(1, 10) as client_id
    UNION ALL
    SELECT 
        'ios' as client_type,
        150 + random() * 100 as latency_ms,
        'client_' || generate_series(11, 20) as client_id
) mock_data
GROUP BY client_type;

-- 권한 부여
GRANT EXECUTE ON FUNCTION get_realtime_latency() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cron_performance_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_api_response_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_realtime_load() TO authenticated;
GRANT SELECT ON realtime_channel_metrics TO authenticated;
GRANT SELECT ON client_realtime_metrics TO authenticated;