-- Update verify_team_fan function to handle anonymous users

CREATE OR REPLACE FUNCTION verify_team_fan(
    board_id_param TEXT,
    user_id_param UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    board_record RECORD;
    profile_record RECORD;
    is_fan BOOLEAN DEFAULT FALSE;
    result JSON;
BEGIN
    -- Get board information
    SELECT * INTO board_record 
    FROM boards 
    WHERE id = board_id_param;
    
    -- If board not found
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Board not found',
            'can_read', false,
            'can_write', false
        );
    END IF;
    
    -- Check if user is authenticated
    IF user_id_param IS NULL AND auth.uid() IS NULL THEN
        -- Anonymous user
        RETURN json_build_object(
            'success', true,
            'can_read', true,  -- Anonymous users can read
            'can_write', false, -- Anonymous users cannot write
            'is_fan', false,
            'board_type', board_record.type,
            'message', '로그인이 필요합니다'
        );
    END IF;
    
    -- Use provided user_id or current auth user
    IF user_id_param IS NOT NULL THEN
        SELECT * INTO profile_record 
        FROM profiles 
        WHERE user_id = user_id_param;
    ELSE
        SELECT * INTO profile_record 
        FROM profiles 
        WHERE user_id = auth.uid();
    END IF;
    
    -- If profile not found (shouldn't happen for authenticated users)
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Profile not found',
            'can_read', true,
            'can_write', false
        );
    END IF;
    
    -- Check permissions based on board type
    IF board_record.type = 'all' THEN
        -- All board: everyone can read and write
        result := json_build_object(
            'success', true,
            'can_read', true,
            'can_write', true,
            'is_fan', false,
            'board_type', board_record.type
        );
    ELSIF board_record.type = 'team' THEN
        -- Check if user is a fan of this team
        is_fan := (profile_record.favorite_team_id = board_record.team_id);
        
        result := json_build_object(
            'success', true,
            'can_read', true,  -- Everyone can read team boards
            'can_write', is_fan,
            'is_fan', is_fan,
            'board_type', board_record.type,
            'message', CASE 
                WHEN NOT is_fan THEN board_record.name || ' 팬만 게시글을 작성할 수 있습니다'
                ELSE NULL
            END
        );
    ELSE
        -- Unknown board type
        result := json_build_object(
            'success', false,
            'error', 'Unknown board type',
            'can_read', false,
            'can_write', false
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION verify_team_fan(TEXT, UUID) TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION verify_team_fan IS 
'Verifies if a user has permission to read/write in a specific board.
Allows anonymous users to read all boards but not write.
For team boards, only fans of that team can write.';