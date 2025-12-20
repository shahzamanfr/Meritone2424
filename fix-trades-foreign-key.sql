-- Add foreign key relationship from trades.user_id to profiles.user_id
-- This allows Supabase to properly join trades with profiles

-- First, let's ensure the profiles table has the user_id column indexed
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Now we can add a foreign key from trades.user_id to profiles.user_id
-- But we need to drop the existing constraint first if it exists
DO $$ 
BEGIN
  -- Drop existing foreign key to auth.users if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'trades_user_id_fkey' 
    AND table_name = 'trades'
  ) THEN
    ALTER TABLE public.trades DROP CONSTRAINT trades_user_id_fkey;
  END IF;
END $$;


-- Add foreign key to profiles.user_id instead
ALTER TABLE public.trades 
  ADD CONSTRAINT trades_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
