-- ========================================================
-- 🚀 COMPLETE SUPABASE DATABASE SETUP SCRIPT (Meritone2424)
-- ========================================================
-- This script contains the full schema, triggers, and functions 
-- for the Meritone project. Run this in the Supabase SQL Editor.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles Table
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

-- Post Likes
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post Comments
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

-- Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    headline TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    links JSONB DEFAULT '[]', -- [{label, url}]
    summary TEXT,
    education JSONB DEFAULT '[]', -- [{school, degree, duration, details}]
    technical_skills JSONB DEFAULT '[]', -- [{section, items: []}]
    experience JSONB DEFAULT '[]', -- [{company, role, duration, bullets: []}]
    projects JSONB DEFAULT '[]', -- [{name, description, bullets: [], links: []}]
    achievements JSONB DEFAULT '[]', -- [string]
    certifications JSONB DEFAULT '[]', -- [{name, issuer, year}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Messaging System (Aligned with UnifiedMessagingService.ts)
-- =============================================

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

-- Trade Comments
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

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_conversations_user_one ON conversations(user_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_two ON conversations(user_two_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_comments_trade_id ON public.trade_comments(trade_id);

-- 4. FUNCTIONS & TRIGGERS

-- Updated At Column Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_comments_updated_at BEFORE UPDATE ON public.trade_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Messaging Trigger: Update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message = NEW.content, last_message_at = NEW.created_at, updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Post Counts Trigger
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
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
            UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        ELSIF TG_TABLE_NAME = 'post_comments' THEN
            UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION update_post_counts();
CREATE TRIGGER update_comments_count AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- 5. RPC FUNCTIONS

-- Messaging: Get or Create Conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_one_id UUID, p_user_two_id UUID)
RETURNS UUID AS $$
DECLARE 
    v_id UUID;
    v_u1 UUID := LEAST(p_user_one_id, p_user_two_id);
    v_u2 UUID := GREATEST(p_user_one_id, p_user_two_id);
BEGIN
    SELECT id INTO v_id FROM conversations
    WHERE (user_one_id = v_u1 AND user_two_id = v_u2);
    
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
    
    INSERT INTO conversations (user_one_id, user_two_id)
    VALUES (v_u1, v_u2)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Messaging: Get User Conversations
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
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != p_user_id AND m.read_at IS NULL) as unread_count,
        COALESCE(s.is_online, false) as is_online
    FROM conversations c
    JOIN profiles p ON p.user_id = (CASE WHEN c.user_one_id = p_user_id THEN c.user_two_id ELSE c.user_one_id END)
    LEFT JOIN user_status s ON s.user_id = p.user_id
    WHERE (c.user_one_id = p_user_id AND c.deleted_by_user_one = FALSE) 
       OR (c.user_two_id = p_user_id AND c.deleted_by_user_two = FALSE)
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Messaging: Get Conversation Messages
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
    FROM messages m
    JOIN profiles p ON p.user_id = m.sender_id
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Messaging: Mark Conversation as Read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_user_id UUID, p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages SET read_at = NOW(), status = 'read' WHERE conversation_id = p_conversation_id AND sender_id != p_user_id AND read_at IS NULL;
    INSERT INTO user_conversation_reads (user_id, conversation_id, last_read_at)
    VALUES (p_user_id, p_conversation_id, NOW())
    ON CONFLICT (user_id, conversation_id) DO UPDATE SET last_read_at = NOW(), updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Follow System RPCs
CREATE OR REPLACE FUNCTION follow_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    result JSON;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'Not authenticated'); END IF;
    IF current_user_id = target_user_id THEN RETURN json_build_object('success', false, 'error', 'Cannot follow yourself'); END IF;
    
    INSERT INTO follows (follower_id, following_id) VALUES (current_user_id, target_user_id) ON CONFLICT DO NOTHING;
    
    SELECT json_build_object('success', true) INTO result;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION unfollow_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    result JSON;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'Not authenticated'); END IF;
    
    DELETE FROM follows WHERE follower_id = current_user_id AND following_id = target_user_id;
    
    SELECT json_build_object('success', true) INTO result;
    RETURN result;
END;
$$;

-- Get detailed relationship data (Followers/Following counts and status)
CREATE OR REPLACE FUNCTION get_relationship_data(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    is_following BOOLEAN;
    follower_count INT;
    following_count INT;
    result JSON;
BEGIN
    current_user_id := auth.uid();
    
    -- Check if current user is following target
    IF current_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM follows 
            WHERE follower_id = current_user_id AND following_id = target_user_id
        ) INTO is_following;
    ELSE
        is_following := FALSE;
    END IF;
    
    -- Get counts
    SELECT count(*) INTO follower_count FROM follows WHERE following_id = target_user_id;
    SELECT count(*) INTO following_count FROM follows WHERE follower_id = target_user_id;
    
    SELECT json_build_object(
        'is_following', is_following,
        'follower_count', follower_count,
        'following_count', following_count
    ) INTO result;
    
    RETURN result;
END;
$$;

-- View for follow stats
CREATE OR REPLACE VIEW public.user_follow_stats AS
SELECT 
    p.user_id,
    p.name,
    p.username,
    (SELECT count(*) FROM follows WHERE following_id = p.user_id) as follower_count,
    (SELECT count(*) FROM follows WHERE follower_id = p.user_id) as following_count
FROM profiles p;

-- 6. RLS POLICIES

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read all trades" ON public.trades FOR SELECT USING (true);
CREATE POLICY "Users can insert their own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trades" ON public.trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trades" ON public.trades FOR DELETE USING (auth.uid() = user_id);

-- Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view follow relationships" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Messaging RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conversation_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_access" ON public.conversations FOR ALL USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);
CREATE POLICY "msg_select" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND (user_one_id = auth.uid() OR user_two_id = auth.uid())));
CREATE POLICY "msg_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND (user_one_id = auth.uid() OR user_two_id = auth.uid())));
CREATE POLICY "status_select" ON public.user_status FOR SELECT USING (true);
CREATE POLICY "status_upsert" ON public.user_status FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "typing_select" ON public.typing_indicators FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_user_id);
CREATE POLICY "typing_upsert" ON public.typing_indicators FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "read_access" ON public.user_conversation_reads FOR ALL USING (auth.uid() = user_id);

-- Resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own resume" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their resume" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their resume" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their resume" ON public.resumes FOR DELETE USING (auth.uid() = user_id);

-- Trade Comments RLS
ALTER TABLE public.trade_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read trade comments" ON public.trade_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments to trades" ON public.trade_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trade comments" ON public.trade_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trade comments" ON public.trade_comments FOR DELETE USING (auth.uid() = user_id);

-- 7. STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 8. REALTIME
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.user_status REPLICA IDENTITY FULL;
ALTER TABLE public.typing_indicators REPLICA IDENTITY FULL;
ALTER TABLE public.follows REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.trades REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;

DO $$
DECLARE tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['conversations', 'messages', 'user_status', 'typing_indicators', 'follows', 'profiles', 'trades', 'posts', 'trade_comments']) LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = tbl) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
        END IF;
    END LOOP;
END $$;

ALTER TABLE public.trade_comments REPLICA IDENTITY FULL;
