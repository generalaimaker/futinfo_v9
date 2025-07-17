-- Supabase posts 테이블 생성
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    author_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'discussion', 'question', 'news')),
    tags TEXT[] DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 인덱스 생성
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted);
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Row Level Security (RLS) 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 삭제되지 않은 게시글을 읽을 수 있도록 정책 설정
CREATE POLICY "Anyone can read non-deleted posts" ON posts
    FOR SELECT
    USING (is_deleted = false);

-- 인증된 사용자만 게시글을 생성할 수 있도록 정책 설정
CREATE POLICY "Authenticated users can create posts" ON posts
    FOR INSERT
    WITH CHECK (auth.uid()::text = author_id);

-- 작성자만 자신의 게시글을 수정할 수 있도록 정책 설정
CREATE POLICY "Authors can update their own posts" ON posts
    FOR UPDATE
    USING (auth.uid()::text = author_id)
    WITH CHECK (auth.uid()::text = author_id);

-- 작성자만 자신의 게시글을 삭제(is_deleted=true)할 수 있도록 정책 설정
CREATE POLICY "Authors can soft delete their own posts" ON posts
    FOR UPDATE
    USING (auth.uid()::text = author_id AND is_deleted = false)
    WITH CHECK (auth.uid()::text = author_id AND is_deleted = true);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (옵션)
INSERT INTO posts (title, content, author, author_id, category, tags, likes, comments) VALUES
    ('맨시티 vs 리버풀 경기 어떻게 보셨나요?', '오늘 경기 정말 명경기였네요! 특히 홀란드의 골이 인상적이었습니다.', '축구팬123', 'sample-user-1', 'discussion', ARRAY['맨시티', '리버풀', '프리미어리그'], 15, 8),
    ('레알 마드리드 새 영입 소식', '레알 마드리드가 새로운 미드필더 영입을 추진한다는 소식이 있네요.', '마드리디스타', 'sample-user-2', 'news', ARRAY['레알마드리드', '이적', '라리가'], 23, 12),
    ('손흥민 부상 소식이 걱정되네요', '토트넘 경기에서 손흥민이 부상을 당했다는데, 심각하지 않았으면 좋겠습니다.', '토트넘팬', 'sample-user-3', 'general', ARRAY['손흥민', '토트넘', '부상'], 45, 20),
    ('챔피언스리그 16강 대진 예상해보세요!', '이번 챔피언스리그 16강 대진이 어떻게 될지 궁금하네요. 여러분의 예상은?', 'UCL매니아', 'sample-user-4', 'question', ARRAY['챔피언스리그', '16강', '예상'], 8, 15),
    ('바르셀로나 vs 아틀레티코 마드리드 경기 분석', '어제 경기에서 바르셀로나의 전술이 인상적이었습니다. 특히 미드필드 압박이...', '전술분석가', 'sample-user-5', 'discussion', ARRAY['바르셀로나', '아틀레티코', '전술분석'], 32, 18);