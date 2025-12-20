-- RLS policies for follows table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- Create a view for follower counts (for better performance)
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
