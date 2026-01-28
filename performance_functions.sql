-- ========================================================
-- 🚀 CRITICAL PERFORMANCE FUNCTIONS
-- ========================================================
-- These functions eliminate N+1 queries and use JOINs for speed
-- Run this AFTER add_performance_indexes.sql

-- ========================================================
-- 1. GET POSTS WITH ALL DETAILS (Single Query, No N+1)
-- ========================================================
-- This replaces multiple separate queries with ONE optimized query
-- Speed improvement: 1.13s → ~50-100ms

CREATE OR REPLACE FUNCTION get_posts_with_details(
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0,
  filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  post_type TEXT,
  skills_offered TEXT[],
  skills_needed TEXT[],
  experience_level TEXT,
  availability TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  media_urls TEXT[],
  likes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  -- User profile data (joined)
  user_name TEXT,
  user_username TEXT,
  user_profile_picture TEXT,
  -- Aggregated data
  total_likes BIGINT,
  total_comments BIGINT,
  liked_by_user_ids UUID[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.content,
    p.post_type,
    p.skills_offered,
    p.skills_needed,
    p.experience_level,
    p.availability,
    p.deadline,
    p.media_urls,
    p.likes_count,
    p.comments_count,
    p.created_at,
    p.updated_at,
    -- Join user profile data
    prof.name AS user_name,
    prof.username AS user_username,
    prof.profile_picture AS user_profile_picture,
    -- Aggregate likes count
    COALESCE(COUNT(DISTINCT pl.id), 0)::BIGINT AS total_likes,
    -- Aggregate comments count
    COALESCE(COUNT(DISTINCT pc.id), 0)::BIGINT AS total_comments,
    -- Array of user IDs who liked this post
    ARRAY_AGG(DISTINCT pl.user_id) FILTER (WHERE pl.user_id IS NOT NULL) AS liked_by_user_ids
  FROM public.posts p
  LEFT JOIN public.profiles prof ON p.user_id = prof.user_id
  LEFT JOIN public.post_likes pl ON p.id = pl.post_id
  LEFT JOIN public.post_comments pc ON p.id = pc.post_id
  WHERE (filter_user_id IS NULL OR p.user_id = filter_user_id)
  GROUP BY 
    p.id, p.user_id, p.title, p.content, p.post_type, 
    p.skills_offered, p.skills_needed, p.experience_level, 
    p.availability, p.deadline, p.media_urls, p.likes_count, 
    p.comments_count, p.created_at, p.updated_at,
    prof.name, prof.username, prof.profile_picture
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ========================================================
-- 2. GET USER PROFILE WITH STATS (Single Query)
-- ========================================================
-- Gets profile + follower/following counts in one query

CREATE OR REPLACE FUNCTION get_user_profile_with_stats(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  username TEXT,
  email TEXT,
  bio TEXT,
  location TEXT,
  profile_picture TEXT,
  skills_i_have TEXT[],
  skills_i_want TEXT[],
  top_skills TEXT[],
  experience_level TEXT,
  availability TEXT,
  preferred_work TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  followers_count BIGINT,
  following_count BIGINT,
  posts_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.*,
    -- Count followers
    (SELECT COUNT(*) FROM public.follows WHERE following_id = p.user_id)::BIGINT AS followers_count,
    -- Count following
    (SELECT COUNT(*) FROM public.follows WHERE follower_id = p.user_id)::BIGINT AS following_count,
    -- Count posts
    (SELECT COUNT(*) FROM public.posts WHERE user_id = p.user_id)::BIGINT AS posts_count
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- ========================================================
-- 3. GET POST COMMENTS WITH USER DATA (Single Query)
-- ========================================================
-- Gets all comments for a post with user info in one query

CREATE OR REPLACE FUNCTION get_post_comments_with_users(target_post_id UUID)
RETURNS TABLE (
  id UUID,
  post_id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_username TEXT,
  user_profile_picture TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.post_id,
    pc.user_id,
    pc.content,
    pc.created_at,
    pc.updated_at,
    prof.name AS user_name,
    prof.username AS user_username,
    prof.profile_picture AS user_profile_picture
  FROM public.post_comments pc
  LEFT JOIN public.profiles prof ON pc.user_id = prof.user_id
  WHERE pc.post_id = target_post_id
  ORDER BY pc.created_at DESC;
END;
$$;

-- ========================================================
-- 4. GET FEED FOR USER (Optimized for Social Feed)
-- ========================================================
-- Gets posts from followed users + own posts

CREATE OR REPLACE FUNCTION get_user_feed(
  current_user_id UUID,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  post_type TEXT,
  skills_offered TEXT[],
  skills_needed TEXT[],
  experience_level TEXT,
  availability TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  media_urls TEXT[],
  likes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_username TEXT,
  user_profile_picture TEXT,
  total_likes BIGINT,
  total_comments BIGINT,
  liked_by_user_ids UUID[],
  is_following BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.content,
    p.post_type,
    p.skills_offered,
    p.skills_needed,
    p.experience_level,
    p.availability,
    p.deadline,
    p.media_urls,
    p.likes_count,
    p.comments_count,
    p.created_at,
    p.updated_at,
    prof.name AS user_name,
    prof.username AS user_username,
    prof.profile_picture AS user_profile_picture,
    COALESCE(COUNT(DISTINCT pl.id), 0)::BIGINT AS total_likes,
    COALESCE(COUNT(DISTINCT pc.id), 0)::BIGINT AS total_comments,
    ARRAY_AGG(DISTINCT pl.user_id) FILTER (WHERE pl.user_id IS NOT NULL) AS liked_by_user_ids,
    EXISTS(SELECT 1 FROM public.follows WHERE follower_id = current_user_id AND following_id = p.user_id) AS is_following
  FROM public.posts p
  LEFT JOIN public.profiles prof ON p.user_id = prof.user_id
  LEFT JOIN public.post_likes pl ON p.id = pl.post_id
  LEFT JOIN public.post_comments pc ON p.id = pc.post_id
  WHERE 
    -- Show posts from users you follow OR your own posts
    p.user_id = current_user_id 
    OR p.user_id IN (
      SELECT following_id 
      FROM public.follows 
      WHERE follower_id = current_user_id
    )
  GROUP BY 
    p.id, p.user_id, p.title, p.content, p.post_type, 
    p.skills_offered, p.skills_needed, p.experience_level, 
    p.availability, p.deadline, p.media_urls, p.likes_count, 
    p.comments_count, p.created_at, p.updated_at,
    prof.name, prof.username, prof.profile_picture
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ========================================================
-- VERIFICATION QUERY
-- ========================================================
-- Run this to verify all functions were created successfully

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_posts_with_details',
    'get_user_profile_with_stats',
    'get_post_comments_with_users',
    'get_user_feed'
  )
ORDER BY routine_name;
