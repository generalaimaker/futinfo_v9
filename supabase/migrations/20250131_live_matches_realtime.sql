-- 라이브 경기 테이블 생성
CREATE TABLE IF NOT EXISTS live_matches (
    fixture_id INTEGER PRIMARY KEY,
    league_id INTEGER NOT NULL,
    league_name TEXT NOT NULL,
    home_team_id INTEGER NOT NULL,
    home_team_name TEXT NOT NULL,
    home_team_logo TEXT,
    away_team_id INTEGER NOT NULL,
    away_team_name TEXT NOT NULL,
    away_team_logo TEXT,
    status TEXT NOT NULL,
    status_short TEXT NOT NULL,
    elapsed INTEGER,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue_name TEXT,
    venue_city TEXT,
    referee TEXT,
    round TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 라이브 경기 이벤트 테이블
CREATE TABLE IF NOT EXISTS live_match_events (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES live_matches(fixture_id) ON DELETE CASCADE,
    time_elapsed INTEGER NOT NULL,
    time_extra INTEGER,
    team_id INTEGER NOT NULL,
    team_name TEXT NOT NULL,
    player_id INTEGER,
    player_name TEXT,
    assist_id INTEGER,
    assist_name TEXT,
    type TEXT NOT NULL, -- Goal, Card, Subst, Var
    detail TEXT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 라이브 경기 통계 테이블
CREATE TABLE IF NOT EXISTS live_match_statistics (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES live_matches(fixture_id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL,
    team_name TEXT NOT NULL,
    statistics JSONB NOT NULL, -- 모든 통계를 JSON으로 저장
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_live_matches_status ON live_matches(status_short);
CREATE INDEX idx_live_matches_date ON live_matches(match_date);
CREATE INDEX idx_live_matches_updated ON live_matches(last_updated);
CREATE INDEX idx_live_match_events_fixture ON live_match_events(fixture_id);
CREATE INDEX idx_live_match_statistics_fixture ON live_match_statistics(fixture_id);

-- Row Level Security 활성화
ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_match_statistics ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 정책 (모든 사용자)
CREATE POLICY "Enable read access for all users" ON live_matches
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON live_match_events
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON live_match_statistics
    FOR SELECT USING (true);

-- 쓰기 권한은 서비스 역할만 가능
CREATE POLICY "Enable insert for service role only" ON live_matches
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for service role only" ON live_matches
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Enable delete for service role only" ON live_matches
    FOR DELETE USING (auth.role() = 'service_role');

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE live_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE live_match_events;
ALTER PUBLICATION supabase_realtime ADD TABLE live_match_statistics;

-- 자동 정리 함수 (오래된 라이브 경기 데이터 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_live_matches()
RETURNS void AS $$
BEGIN
    -- 종료된 지 2시간이 지난 경기 삭제
    DELETE FROM live_matches 
    WHERE status_short IN ('FT', 'AET', 'PEN', 'CANC', 'PST', 'ABD')
    AND last_updated < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;

-- 정리 작업 스케줄링 (pg_cron 필요)
-- SELECT cron.schedule('cleanup-old-live-matches', '0 * * * *', 'SELECT cleanup_old_live_matches();');