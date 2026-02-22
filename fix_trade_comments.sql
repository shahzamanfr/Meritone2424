-- 1. Remove redundant columns from trade_comments and trades
ALTER TABLE public.trade_comments DROP COLUMN IF EXISTS user_display_name;
ALTER TABLE public.trade_comments DROP COLUMN IF EXISTS user_profile_picture;
ALTER TABLE public.trades DROP COLUMN IF EXISTS user_display_name;
ALTER TABLE public.trades DROP COLUMN IF EXISTS comments;

-- 2. Add status column to trade_comments if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_comments' AND column_name = 'status') THEN
        ALTER TABLE public.trade_comments ADD COLUMN status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending';
    END IF;
END $$;

-- 3. Update RLS policies for trade_comments
DROP POLICY IF EXISTS "Users can delete their own trade comments" ON public.trade_comments;
CREATE POLICY "Users can delete their own trade comments" 
    ON public.trade_comments FOR DELETE 
    USING (auth.uid() = user_id);

-- 4. Update RLS policies for trades
DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
CREATE POLICY "Users can delete their own trades" 
    ON public.trades FOR DELETE 
    USING (auth.uid() = user_id);
