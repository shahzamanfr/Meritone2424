-- ========================================================
-- 🚀 COMPLETE SUPABASE DATABASE SETUP - MERITONE
-- ========================================================
-- This is the COMPLETE database setup for a fresh Supabase project
-- Run this entire file in your Supabase SQL Editor
-- 
-- Features included:
-- ✅ Authentication & Profiles
-- ✅ Posts (with likes & comments)
-- ✅ Followers System
-- ✅ Messaging System
-- ✅ Trades System
-- ✅ Resume Builder
-- ✅ All RLS Policies
-- ✅ All Triggers & Functions
-- ✅ Performance Indexes
-- ✅ Realtime Support
-- ========================================================

-- ========================================================
-- PART 1: EXTENSIONS
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ========================================================
-- PART 2: TABLES
-- ========================================================

-- Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT NOT NULL,
    bio TEXT,
    location TEXT,
    profile_picture TEXT,
    skills_i_have TEXT[],
    skills_i_want TEXT[],
    top_skills TEXT[],
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    availability TEXT CHECK (availability IN ('full_time', 'part_time', 'project_based')),
    preferred_work TEXT CHECK (preferred_work IN ('online', 'offline', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT CHECK (post_type IN ('skill_offer', 'skill_request', 'project', 'general')) NOT NULL,
    skills_offered TEXT[],
    skills_needed TEXT[],
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    availability TEXT CHECK (availability IN ('full_time', 'part_time', 'project_based')),
    deadline TIMESTAMP WITH TIME ZONE,
    media_urls TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post Comments Table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Trades Table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    skill_offered TEXT NOT NULL,
    skill_wanted TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    user_display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Assigned', 'Completed')),
    comments JSONB DEFAULT '[]'::jsonb,
    location TEXT,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade Comments Table
CREATE TABLE IF NOT EXISTS public.trade_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    user_display_name TEXT NOT NULL,
    user_profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    headline TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    links JSONB DEFAULT '[]',
    summary TEXT,
    education JSONB DEFAULT '[]',
    technical_skills JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================================
-- MESSAGING SYSTEM TABLES
-- ========================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_two_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_by_user_one BOOLEAN DEFAULT FALSE,
    deleted_by_user_two BOOLEAN DEFAULT FALSE,
    CONSTRAINT unique_conversation UNIQUE (user_one_id, user_two_id),
    CONSTRAINT no_self_conversation CHECK (user_one_id != user_two_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.user_conversation_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, conversation_id)
);

CREATE TABLE IF NOT EXISTS public.user_status (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    status_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, target_user_id)
);

-- ========================================================
-- PART 3: INDEXES FOR PERFORMANCE
-- ========================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Posts indexes (CRITICAL for feed performance)
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);

-- Post likes indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON public.post_likes(user_id, post_id);

-- Post comments indexes
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at DESC);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Trade indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_comments_trade_id ON public.trade_comments(trade_id);

-- Messaging indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_one ON public.conversations(user_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_two ON public.conversations(user_two_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- ========================================================
-- PART 4: FUNCTIONS & TRIGGERS
-- ========================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON public.trades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON public.posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_comments_updated_at ON public.post_comments;
CREATE TRIGGER update_post_comments_updated_at 
    BEFORE UPDATE ON public.post_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
CREATE TRIGGER update_resumes_updated_at 
    BEFORE UPDATE ON public.resumes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trade_comments_updated_at ON public.trade_comments;
CREATE TRIGGER update_trade_comments_updated_at 
    BEFORE UPDATE ON public.trade_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update post counts (likes & comments)
-- CRITICAL: Uses SECURITY DEFINER to bypass RLS
DROP FUNCTION IF EXISTS update_post_counts() CASCADE;
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER 
SECURITY DEFINER  -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'post_likes' THEN
            UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_TABLE_NAME = 'post_comments' THEN
            UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'post_likes' THEN
            UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
        ELSIF TG_TABLE_NAME = 'post_comments' THEN
            UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply post count triggers
DROP TRIGGER IF EXISTS update_likes_count ON public.post_likes;
CREATE TRIGGER update_likes_count 
    AFTER INSERT OR DELETE ON public.post_likes 
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS update_comments_count ON public.post_comments;
CREATE TRIGGER update_comments_count 
    AFTER INSERT OR DELETE ON public.post_comments 
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Function: Update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET last_message = NEW.content, 
        last_message_at = NEW.created_at, 
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON public.messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON public.messages 
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ========================================================
-- PART 5: RPC FUNCTIONS (For complex queries)
-- ========================================================

-- Get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_one_id UUID, p_user_two_id UUID)
RETURNS UUID AS $$
DECLARE 
    v_id UUID;
    v_u1 UUID := LEAST(p_user_one_id, p_user_two_id);
    v_u2 UUID := GREATEST(p_user_one_id, p_user_two_id);
BEGIN
    SELECT id INTO v_id FROM public.conversations
    WHERE (user_one_id = v_u1 AND user_two_id = v_u2);
    
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
    
    INSERT INTO public.conversations (user_one_id, user_two_id)
    VALUES (v_u1, v_u2)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user conversations with unread counts
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    conversation_id UUID,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_picture TEXT,
    other_user_username TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT,
    is_online BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as conversation_id,
        CASE WHEN c.user_one_id = p_user_id THEN c.user_two_id ELSE c.user_one_id END as other_user_id,
        p.name as other_user_name,
        p.profile_picture as other_user_picture,
        p.username as other_user_username,
        c.last_message,
        c.last_message_at,
        (SELECT COUNT(*) FROM public.messages m WHERE m.conversation_id = c.id AND m.sender_id != p_user_id AND m.read_at IS NULL) as unread_count,
        COALESCE(s.is_online, false) as is_online
    FROM public.conversations c
    JOIN public.profiles p ON p.user_id = (CASE WHEN c.user_one_id = p_user_id THEN c.user_two_id ELSE c.user_one_id END)
    LEFT JOIN public.user_status s ON s.user_id = p.user_id
    WHERE (c.user_one_id = p_user_id AND c.deleted_by_user_one = FALSE) 
       OR (c.user_two_id = p_user_id AND c.deleted_by_user_two = FALSE)
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get conversation messages
CREATE OR REPLACE FUNCTION get_conversation_messages(p_conversation_id UUID, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    id UUID,
    conversation_id UUID,
    sender_id UUID,
    content TEXT,
    message_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    sender_name TEXT,
    sender_picture TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id, m.conversation_id, m.sender_id, m.content, m.message_type, m.status, m.created_at, m.updated_at, m.read_at,
        p.name as sender_name, p.profile_picture as sender_picture
    FROM public.messages m
    JOIN public.profiles p ON p.user_id = m.sender_id
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_user_id UUID, p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages SET read_at = NOW(), status = 'read' 
    WHERE conversation_id = p_conversation_id AND sender_id != p_user_id AND read_at IS NULL;
    
    INSERT INTO public.user_conversation_reads (user_id, conversation_id, last_read_at)
    VALUES (p_user_id, p_conversation_id, NOW())
    ON CONFLICT (user_id, conversation_id) 
    DO UPDATE SET last_read_at = NOW(), updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Follow user
CREATE OR REPLACE FUNCTION follow_user(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    result JSON;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'Not authenticated'); END IF;
    IF current_user_id = target_user_id THEN RETURN json_build_object('success', false, 'error', 'Cannot follow yourself'); END IF;
    
    INSERT INTO public.follows (follower_id, following_id) 
    VALUES (current_user_id, target_user_id) 
    ON CONFLICT DO NOTHING;
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unfollow user
CREATE OR REPLACE FUNCTION unfollow_user(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'Not authenticated'); END IF;
    
    DELETE FROM public.follows WHERE follower_id = current_user_id AND following_id = target_user_id;
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get relationship data (followers/following counts)
CREATE OR REPLACE FUNCTION get_relationship_data(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    is_following BOOLEAN;
    follower_count INT;
    following_count INT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.follows 
            WHERE follower_id = current_user_id AND following_id = target_user_id
        ) INTO is_following;
    ELSE
        is_following := FALSE;
    END IF;
    
    SELECT count(*) INTO follower_count FROM public.follows WHERE following_id = target_user_id;
    SELECT count(*) INTO following_count FROM public.follows WHERE follower_id = target_user_id;
    
    RETURN json_build_object(
        'is_following', is_following,
        'follower_count', follower_count,
        'following_count', following_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user profile is complete
-- A complete profile requires: name (already enforced), bio, and at least one skill
CREATE OR REPLACE FUNCTION is_profile_complete(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile_record RECORD;
BEGIN
    SELECT name, bio, skills_i_have, skills_i_want
    INTO profile_record
    FROM public.profiles
    WHERE user_id = user_id_param;
    
    -- Check if profile exists
    IF profile_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Name is required (already enforced by NOT NULL constraint)
    -- Bio must be filled
    IF profile_record.bio IS NULL OR trim(profile_record.bio) = '' THEN
        RETURN FALSE;
    END IF;
    
    -- At least one skill required (either in skills_i_have or skills_i_want)
    IF (profile_record.skills_i_have IS NULL OR array_length(profile_record.skills_i_have, 1) IS NULL)
       AND (profile_record.skills_i_want IS NULL OR array_length(profile_record.skills_i_want, 1) IS NULL) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- PART 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- Posts RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" 
    ON public.posts FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts" 
    ON public.posts FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND is_profile_complete(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" 
    ON public.posts FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" 
    ON public.posts FOR DELETE 
    USING (auth.uid() = user_id);

-- Post Likes RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
CREATE POLICY "Anyone can view likes" 
    ON public.post_likes FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts" 
    ON public.post_likes FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND is_profile_complete(auth.uid()));

DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts" 
    ON public.post_likes FOR DELETE 
    USING (auth.uid() = user_id);

-- Post Comments RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
CREATE POLICY "Anyone can view comments" 
    ON public.post_comments FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can add comments" ON public.post_comments;
CREATE POLICY "Users can add comments" 
    ON public.post_comments FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND is_profile_complete(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own comments" ON public.post_comments;
CREATE POLICY "Users can update their own comments" 
    ON public.post_comments FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.post_comments;
CREATE POLICY "Users can delete their own comments" 
    ON public.post_comments FOR DELETE 
    USING (auth.uid() = user_id);

-- Follows RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view follow relationships" ON public.follows;
CREATE POLICY "Anyone can view follow relationships" 
    ON public.follows FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" 
    ON public.follows FOR INSERT 
    WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow others" ON public.follows;
CREATE POLICY "Users can unfollow others" 
    ON public.follows FOR DELETE 
    USING (auth.uid() = follower_id);

-- Trades RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read all trades" ON public.trades;
CREATE POLICY "Users can read all trades" 
    ON public.trades FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
CREATE POLICY "Users can insert their own trades" 
    ON public.trades FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND is_profile_complete(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
CREATE POLICY "Users can update their own trades" 
    ON public.trades FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
CREATE POLICY "Users can delete their own trades" 
    ON public.trades FOR DELETE 
    USING (auth.uid() = user_id);

-- Trade Comments RLS
ALTER TABLE public.trade_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read trade comments" ON public.trade_comments;
CREATE POLICY "Anyone can read trade comments" 
    ON public.trade_comments FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can add comments to trades" ON public.trade_comments;
CREATE POLICY "Users can add comments to trades" 
    ON public.trade_comments FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND is_profile_complete(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own trade comments" ON public.trade_comments;
CREATE POLICY "Users can update their own trade comments" 
    ON public.trade_comments FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trade comments" ON public.trade_comments;
CREATE POLICY "Users can delete their own trade comments" 
    ON public.trade_comments FOR DELETE 
    USING (auth.uid() = user_id);

-- Resumes RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own resume" ON public.resumes;
CREATE POLICY "Users can view their own resume" 
    ON public.resumes FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their resume" ON public.resumes;
CREATE POLICY "Users can create their resume" 
    ON public.resumes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their resume" ON public.resumes;
CREATE POLICY "Users can update their resume" 
    ON public.resumes FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their resume" ON public.resumes;
CREATE POLICY "Users can delete their resume" 
    ON public.resumes FOR DELETE 
    USING (auth.uid() = user_id);

-- Messaging RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conversation_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conv_access" ON public.conversations;
CREATE POLICY "conv_access" 
    ON public.conversations FOR ALL 
    USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

DROP POLICY IF EXISTS "msg_select" ON public.messages;
CREATE POLICY "msg_select" 
    ON public.messages FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = messages.conversation_id 
        AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
    ));

DROP POLICY IF EXISTS "msg_insert" ON public.messages;
CREATE POLICY "msg_insert" 
    ON public.messages FOR INSERT 
    WITH CHECK (
        auth.uid() = sender_id 
        AND is_profile_complete(auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "status_select" ON public.user_status;
CREATE POLICY "status_select" 
    ON public.user_status FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "status_upsert" ON public.user_status;
CREATE POLICY "status_upsert" 
    ON public.user_status FOR ALL 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "typing_select" ON public.typing_indicators;
CREATE POLICY "typing_select" 
    ON public.typing_indicators FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() = target_user_id);

DROP POLICY IF EXISTS "typing_upsert" ON public.typing_indicators;
CREATE POLICY "typing_upsert" 
    ON public.typing_indicators FOR ALL 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "read_access" ON public.user_conversation_reads;
CREATE POLICY "read_access" 
    ON public.user_conversation_reads FOR ALL 
    USING (auth.uid() = user_id);

-- ========================================================
-- PART 7: STORAGE BUCKETS & POLICIES
-- ========================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ========================================================
-- PART 8: REALTIME CONFIGURATION
-- ========================================================

ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.user_status REPLICA IDENTITY FULL;
ALTER TABLE public.typing_indicators REPLICA IDENTITY FULL;
ALTER TABLE public.follows REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.trades REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER TABLE public.trade_comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
DECLARE tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'conversations', 'messages', 'user_status', 'typing_indicators', 
        'follows', 'profiles', 'trades', 'posts', 'trade_comments', 
        'post_likes', 'post_comments'
    ]) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
        END IF;
    END LOOP;
END $$;

-- ========================================================
-- ✅ SETUP COMPLETE!
-- ========================================================
-- 
-- Next steps:
-- 1. Go to Supabase Dashboard → Authentication → Settings
--    - Enable Email provider
--    - Configure email templates (optional)
-- 
-- 2. Update your .env file with:
--    VITE_SUPABASE_URL=your_project_url
--    VITE_SUPABASE_ANON_KEY=your_anon_key
-- 
-- 3. Test the setup by running these queries:
--    SELECT * FROM pg_tables WHERE schemaname = 'public';
--    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- 
-- All features are now ready:
-- ✅ Authentication & Profiles
-- ✅ Posts with Likes & Comments
-- ✅ Followers System
-- ✅ Messaging System
-- ✅ Trades System
-- ✅ Resume Builder
-- ✅ RLS Policies
-- ✅ Realtime Support
-- ========================================================
