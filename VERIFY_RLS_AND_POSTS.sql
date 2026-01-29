-- ========================================================
-- 🔍 RLS POLICIES AND POSTS LOADING - VERIFICATION QUERIES
-- ========================================================
-- Run these queries in your Supabase SQL Editor to diagnose issues
-- Copy and paste each section separately

-- ========================================================
-- SECTION 1: Verify RLS is Enabled
-- ========================================================
-- Expected: All three tables should have rowsecurity = true

SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('posts', 'post_likes', 'post_comments')
ORDER BY tablename;

-- ========================================================
-- SECTION 2: Check All RLS Policies
-- ========================================================
-- Expected: You should see policies for SELECT, INSERT, UPDATE, DELETE

SELECT 
    tablename,
    policyname,
    cmd as command,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('posts', 'post_likes', 'post_comments')
ORDER BY tablename, policyname;

-- ========================================================
-- SECTION 3: Test Posts Query as Anonymous User
-- ========================================================
-- This simulates what happens when a user is not authenticated
-- Expected: Should return a count > 0 if you have posts

SET ROLE anon;
SELECT COUNT(*) as total_posts FROM posts;
SELECT id, title, user_id, created_at FROM posts LIMIT 5;
RESET ROLE;

-- ========================================================
-- SECTION 4: Verify Trigger Function Security
-- ========================================================
-- Expected: prosecdef should be 't' (true) for SECURITY DEFINER

SELECT 
    p.proname as function_name,
    CASE p.prosecdef 
        WHEN true THEN 'SECURITY DEFINER ✅' 
        ELSE 'SECURITY INVOKER ❌' 
    END as security_type,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname = 'update_post_counts';

-- ========================================================
-- SECTION 5: Check Indexes for Performance
-- ========================================================
-- Expected: Should see indexes on posts, post_likes, post_comments

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('posts', 'post_likes', 'post_comments')
ORDER BY tablename, indexname;

-- ========================================================
-- SECTION 6: Test Actual Posts Query (As Authenticated User)
-- ========================================================
-- This tests the exact query your frontend uses
-- Run this while logged in to Supabase Dashboard

SELECT 
    id,
    user_id,
    title,
    content,
    post_type,
    likes_count,
    comments_count,
    created_at
FROM posts
ORDER BY created_at DESC
LIMIT 15;

-- ========================================================
-- SECTION 7: Check for Orphaned Posts (Missing User Profiles)
-- ========================================================
-- Expected: Should return 0 rows if all posts have valid users

SELECT 
    p.id as post_id,
    p.user_id,
    p.title,
    p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.user_id
WHERE pr.user_id IS NULL
ORDER BY p.created_at DESC;

-- ========================================================
-- SECTION 8: Verify Realtime Publication
-- ========================================================
-- Expected: All three tables should be in supabase_realtime publication

SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename IN ('posts', 'post_likes', 'post_comments')
ORDER BY tablename;

-- ========================================================
-- TROUBLESHOOTING TIPS
-- ========================================================
-- 
-- If SECTION 3 returns 0 rows or an error:
--   → Your RLS policies are blocking anonymous access
--   → Check that "Posts are viewable by everyone" policy exists
--   → Policy should use: USING (true)
--
-- If SECTION 4 shows SECURITY INVOKER:
--   → Run COMPLETE_FIX_RLS_AND_POSTS.sql to fix the trigger
--   → This will allow the trigger to bypass RLS when updating counts
--
-- If SECTION 7 returns rows:
--   → You have posts from deleted users
--   → Either delete these posts or create placeholder profiles
--
-- If posts load slowly:
--   → Check SECTION 5 for missing indexes
--   → Run add_performance_indexes.sql if indexes are missing
--
