-- Complete Follow System Setup
-- Run this script in your Supabase SQL editor to set up the complete follow system

-- 1. Create RPC functions for atomic follow/unfollow operations
CREATE OR REPLACE FUNCTION follow_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    result JSON;
BEGIN
    -- Get current user from auth
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Check if trying to follow self
    IF current_user_id = target_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Cannot follow yourself');
    END IF;
    
    -- Check if already following
    IF EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = current_user_id 
        AND following_id = target_user_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Already following this user');
    END IF;
    
    -- Insert follow relationship
    INSERT INTO follows (follower_id, following_id)
    VALUES (current_user_id, target_user_id);
    
    -- Get updated counts
    SELECT json_build_object(
        'success', true,
        'follower_count', (
            SELECT COUNT(*) FROM follows WHERE following_id = target_user_id
        ),
        'following_count', (
            SELECT COUNT(*) FROM follows WHERE follower_id = target_user_id
        ),
        'current_user_following_count', (
            SELECT COUNT(*) FROM follows WHERE follower_id = current_user_id
        )
    ) INTO result;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to unfollow a user atomically
CREATE OR REPLACE FUNCTION unfollow_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    result JSON;
BEGIN
    -- Get current user from auth
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Check if following
    IF NOT EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = current_user_id 
        AND following_id = target_user_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Not following this user');
    END IF;
    
    -- Delete follow relationship
    DELETE FROM follows 
    WHERE follower_id = current_user_id 
    AND following_id = target_user_id;
    
    -- Get updated counts
    SELECT json_build_object(
        'success', true,
        'follower_count', (
            SELECT COUNT(*) FROM follows WHERE following_id = target_user_id
        ),
        'following_count', (
            SELECT COUNT(*) FROM follows WHERE follower_id = target_user_id
        ),
        'current_user_following_count', (
            SELECT COUNT(*) FROM follows WHERE follower_id = current_user_id
        )
    ) INTO result;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to get relationship data
CREATE OR REPLACE FUNCTION get_relationship_data(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    is_following BOOLEAN;
    follower_count INTEGER;
    following_count INTEGER;
    result JSON;
BEGIN
    -- Get current user from auth
    current_user_id := auth.uid();
    
    -- Check if following
    SELECT EXISTS(
        SELECT 1 FROM follows 
        WHERE follower_id = current_user_id 
        AND following_id = target_user_id
    ) INTO is_following;
    
    -- Get counts
    SELECT COUNT(*) INTO follower_count FROM follows WHERE following_id = target_user_id;
    SELECT COUNT(*) INTO following_count FROM follows WHERE follower_id = target_user_id;
    
    -- Build result
    SELECT json_build_object(
        'is_following', COALESCE(is_following, false),
        'follower_count', COALESCE(follower_count, 0),
        'following_count', COALESCE(following_count, 0)
    ) INTO result;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'is_following', false,
            'follower_count', 0,
            'following_count', 0,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION follow_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_relationship_data(UUID) TO authenticated;

-- 2. RLS policies for follows table
-- Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all follow relationships (for public profiles)
CREATE POLICY "Anyone can view follow relationships" ON follows
    FOR SELECT
    USING (true);

-- Policy: Users can only insert their own follow relationships
CREATE POLICY "Users can follow others" ON follows
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND follower_id = auth.uid()
        AND following_id != auth.uid()
    );

-- Policy: Users can only delete their own follow relationships
CREATE POLICY "Users can unfollow others" ON follows
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL 
        AND follower_id = auth.uid()
    );

-- Policy: Users cannot update follow relationships (no updates allowed)
CREATE POLICY "No updates to follow relationships" ON follows
    FOR UPDATE
    USING (false);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- 4. Create a view for follower counts (for better performance)
CREATE OR REPLACE VIEW user_follow_stats AS
SELECT 
    user_id,
    COALESCE(follower_count, 0) as follower_count,
    COALESCE(following_count, 0) as following_count
FROM profiles
LEFT JOIN (
    SELECT 
        following_id,
        COUNT(*) as follower_count
    FROM follows 
    GROUP BY following_id
) follower_stats ON profiles.user_id = follower_stats.following_id
LEFT JOIN (
    SELECT 
        follower_id,
        COUNT(*) as following_count
    FROM follows 
    GROUP BY follower_id
) following_stats ON profiles.user_id = following_stats.follower_id;

-- Grant access to the view
GRANT SELECT ON user_follow_stats TO authenticated;
GRANT SELECT ON user_follow_stats TO anon;

-- 5. Enable real-time for follows table
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
