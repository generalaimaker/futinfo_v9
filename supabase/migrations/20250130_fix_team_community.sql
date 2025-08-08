-- Drop existing tables if they exist
DROP TABLE IF EXISTS team_post_likes CASCADE;
DROP TABLE IF EXISTS team_comments CASCADE;
DROP TABLE IF EXISTS team_posts CASCADE;
DROP TABLE IF EXISTS match_predictions CASCADE;
DROP TABLE IF EXISTS team_polls CASCADE;

-- Create team_posts table (팀별 게시판)
CREATE TABLE IF NOT EXISTS team_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('general', 'match', 'transfer', 'news', 'discussion')),
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_comments table (댓글)
CREATE TABLE IF NOT EXISTS team_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES team_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_post_likes table (좋아요)
CREATE TABLE IF NOT EXISTS team_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES team_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create match_predictions table (경기 예측)
CREATE TABLE IF NOT EXISTS match_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fixture_id INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fixture_id, user_id)
);

-- Create team_polls table (팀 투표)
CREATE TABLE IF NOT EXISTS team_polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    votes JSONB DEFAULT '{}'::jsonb,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE team_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_polls ENABLE ROW LEVEL SECURITY;

-- Create policies for team_posts
CREATE POLICY "Anyone can view team posts" ON team_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON team_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON team_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON team_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for team_comments
CREATE POLICY "Anyone can view comments" ON team_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON team_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON team_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON team_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for team_post_likes
CREATE POLICY "Anyone can view likes" ON team_post_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts" ON team_post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON team_post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for match_predictions
CREATE POLICY "Anyone can view predictions" ON match_predictions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create predictions" ON match_predictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON match_predictions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for team_polls
CREATE POLICY "Anyone can view polls" ON team_polls
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create polls" ON team_polls
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_team_posts_team_id ON team_posts(team_id);
CREATE INDEX idx_team_posts_created_at ON team_posts(created_at DESC);
CREATE INDEX idx_team_comments_post_id ON team_comments(post_id);
CREATE INDEX idx_team_post_likes_post_id ON team_post_likes(post_id);
CREATE INDEX idx_match_predictions_fixture_id ON match_predictions(fixture_id);
CREATE INDEX idx_team_polls_team_id ON team_polls(team_id);

-- RPC 함수 생성
-- 게시글 좋아요 증가
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE team_posts SET likes = likes + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 게시글 좋아요 감소
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE team_posts SET likes = GREATEST(likes - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
EOF < /dev/null