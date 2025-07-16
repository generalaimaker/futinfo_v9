-- Supabase RLS(Row Level Security) 보안 강화 SQL
-- 현재 대부분의 테이블에서 RLS가 비활성화되어 있어 보안 취약점이 있습니다.
-- 아래 SQL을 순차적으로 실행하여 보안을 강화하세요.

-- ==========================================
-- 1. profiles 테이블 RLS 활성화
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 새 사용자 가입 시 프로필 생성 허용
CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 2. 캐시 테이블들 RLS 정책 추가
-- ==========================================
-- fixtures_cache: 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Anyone can read fixtures cache" ON fixtures_cache
    FOR SELECT USING (true);

-- standings_cache: 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Anyone can read standings cache" ON standings_cache
    FOR SELECT USING (true);

-- fixture_details_cache: 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Anyone can read fixture details cache" ON fixture_details_cache
    FOR SELECT USING (true);

-- ==========================================
-- 3. 커뮤니티 테이블 RLS 정책
-- ==========================================
-- boards: 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Anyone can read boards" ON boards
    FOR SELECT USING (true);

-- posts: 읽기는 모두 가능, 쓰기는 인증된 사용자만
CREATE POLICY "Anyone can read posts" ON posts
    FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create posts" ON posts
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = author_id
        )
    );

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = author_id
        )
    );

-- comments: 읽기는 모두 가능, 쓰기는 인증된 사용자만
CREATE POLICY "Anyone can read comments" ON comments
    FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = author_id
        )
    );

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = author_id
        )
    );

-- ==========================================
-- 4. likes 테이블 RLS
-- ==========================================
CREATE POLICY "Anyone can read likes" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Users can create own likes" ON likes
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = likes.user_id
        )
    );

CREATE POLICY "Users can delete own likes" ON likes
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = likes.user_id
        )
    );

-- ==========================================
-- 5. follows 테이블 RLS
-- ==========================================
CREATE POLICY "Anyone can read follows" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON follows
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = follows.user_id
        )
    );

-- ==========================================
-- 6. API 사용량 추적 테이블 RLS
-- ==========================================
CREATE POLICY "Only admins can read API usage" ON api_usage
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM profiles 
            WHERE user_id = auth.uid() 
            AND user_id IN (
                -- 관리자 ID 목록 (실제 관리자 ID로 교체)
                SELECT unnest(ARRAY[
                    'admin-user-id-1'::uuid,
                    'admin-user-id-2'::uuid
                ])
            )
        )
    );

-- ==========================================
-- 7. Service Role 전용 정책 (Edge Functions용)
-- ==========================================
-- Edge Functions는 service_role 키를 사용하므로 모든 권한 부여
CREATE POLICY "Service role has full access to fixtures_cache" ON fixtures_cache
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to standings_cache" ON standings_cache
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to teams_cache" ON teams_cache
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to players_cache" ON players_cache
    FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- 실행 순서
-- ==========================================
-- 1. Supabase Dashboard SQL Editor에서 실행
-- 2. 각 섹션을 순차적으로 실행
-- 3. 앱에서 기능 테스트
-- 4. 문제 발생 시 정책 수정

-- ==========================================
-- RLS 비활성화 (문제 해결용)
-- ==========================================
-- 문제가 발생하면 아래 명령으로 RLS 비활성화 가능:
-- ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 현재 RLS 상태 확인
-- ==========================================
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';