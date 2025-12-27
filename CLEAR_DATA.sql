-- Clear all posts and trades data
-- This script truncates the following tables to ensure a clean state

-- Disable triggers temporarily to avoid overhead if needed, though TRUNCATE handles it
-- TRUNCATE also resets identity columns

DO $$ 
BEGIN
  -- Clear posts related data
  TRUNCATE TABLE public.post_comments CASCADE;
  TRUNCATE TABLE public.post_likes CASCADE;
  TRUNCATE TABLE public.posts CASCADE;

  -- Clear trades data
  TRUNCATE TABLE public.trades CASCADE;

  -- Optional: Notify Schema reload
  NOTIFY pgrst, 'reload schema';
END $$;
