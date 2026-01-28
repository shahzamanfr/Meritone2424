-- ========================================================
-- 🚀 CRITICAL FIX: Create View for Posts with User Data
-- ========================================================
-- This view pre-joins posts with profiles for fast queries
-- Run this in Supabase SQL Editor

-- First, ensure indexes exist for fast JOINs
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Drop the view if it exists
DROP VIEW IF EXISTS public.posts_with_users CASCADE;

-- Create a view that joins posts with profiles
CREATE VIEW public.posts_with_users AS
SELECT 
  p.*,
  prof.name as user_name,
  prof.username as user_username,
  prof.profile_picture as user_profile_picture,
  prof.email as user_email
FROM public.posts p
LEFT JOIN public.profiles prof ON p.user_id = prof.user_id;

-- Grant access to the view
GRANT SELECT ON public.posts_with_users TO authenticated;
GRANT SELECT ON public.posts_with_users TO anon;

-- Verify the view was created
SELECT COUNT(*) as total_posts FROM public.posts_with_users;
