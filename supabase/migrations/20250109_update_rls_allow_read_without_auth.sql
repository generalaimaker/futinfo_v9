-- Update RLS policies to allow reading without authentication

-- Drop existing policies for boards
DROP POLICY IF EXISTS "Allow read access to all boards" ON boards;
DROP POLICY IF EXISTS "Allow authenticated users to create boards" ON boards;

-- Create new policies for boards
CREATE POLICY "Allow read access to all boards"
ON boards FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow authenticated users to create boards"
ON boards FOR INSERT
TO authenticated
WITH CHECK (true);

-- Drop existing policies for posts
DROP POLICY IF EXISTS "Allow read access to all posts" ON posts;
DROP POLICY IF EXISTS "Allow authenticated users to create posts in all board" ON posts;
DROP POLICY IF EXISTS "Allow team fans to create posts in team boards" ON posts;
DROP POLICY IF EXISTS "Allow users to update their own posts" ON posts;
DROP POLICY IF EXISTS "Allow users to delete their own posts" ON posts;

-- Create new policies for posts
CREATE POLICY "Allow read access to all posts"
ON posts FOR SELECT
TO anon, authenticated
USING (is_deleted = false);

CREATE POLICY "Allow authenticated users to create posts in all board"
ON posts FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM boards
        WHERE boards.id = board_id
        AND boards.type = 'all'
    )
);

CREATE POLICY "Allow team fans to create posts in team boards"
ON posts FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM boards b
        JOIN profiles p ON p.user_id = auth.uid()
        WHERE b.id = board_id
        AND b.type = 'team'
        AND p.favorite_team_id = b.team_id
    )
);

CREATE POLICY "Allow users to update their own posts"
ON posts FOR UPDATE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    author_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Allow users to delete their own posts"
ON posts FOR DELETE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Drop existing policies for comments
DROP POLICY IF EXISTS "Allow read access to all comments" ON comments;
DROP POLICY IF EXISTS "Allow authenticated users to create comments" ON comments;
DROP POLICY IF EXISTS "Allow users to update their own comments" ON comments;
DROP POLICY IF EXISTS "Allow users to delete their own comments" ON comments;

-- Create new policies for comments
CREATE POLICY "Allow read access to all comments"
ON comments FOR SELECT
TO anon, authenticated
USING (is_deleted = false);

CREATE POLICY "Allow authenticated users to create comments"
ON comments FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if the user can comment on this post
    EXISTS (
        SELECT 1 FROM posts p
        JOIN boards b ON b.id = p.board_id
        WHERE p.id = post_id
        AND (
            -- All board: any authenticated user can comment
            (b.type = 'all')
            OR
            -- Team board: only team fans can comment
            (b.type = 'team' AND EXISTS (
                SELECT 1 FROM profiles prof
                WHERE prof.user_id = auth.uid()
                AND prof.favorite_team_id = b.team_id
            ))
        )
    )
);

CREATE POLICY "Allow users to update their own comments"
ON comments FOR UPDATE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    author_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Allow users to delete their own comments"
ON comments FOR DELETE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Update likes policies to only allow authenticated users
DROP POLICY IF EXISTS "Allow users to view their own likes" ON likes;
DROP POLICY IF EXISTS "Allow users to manage their own likes" ON likes;

CREATE POLICY "Allow authenticated users to view likes"
ON likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to manage their own likes"
ON likes FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add comment explaining the access model
COMMENT ON POLICY "Allow read access to all posts" ON posts IS 
'Allows both authenticated and anonymous users to read all non-deleted posts. 
This enables viewing community content without requiring login.';

COMMENT ON POLICY "Allow read access to all comments" ON comments IS 
'Allows both authenticated and anonymous users to read all non-deleted comments. 
This enables viewing full discussions without requiring login.';