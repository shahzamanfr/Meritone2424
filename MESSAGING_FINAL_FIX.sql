-- 🚀 FINAL MESSAGING SYSTEM RESTORATION SCRIPT
-- This script aligns the database schema and functions with UnifiedMessagingService.ts
-- Run this in the Supabase SQL Editor.

-- 1. CLEANUP (Drop existing functions and tables)
DROP FUNCTION IF EXISTS public.get_or_create_conversation(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_conversations(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_conversations(uuid, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_conversation_messages(uuid, uuid, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_conversation_messages(uuid, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.mark_conversation_as_read(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS public.update_conv_last_msg() CASCADE;
DROP FUNCTION IF EXISTS public.bump_conversation_timestamp() CASCADE;

DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.user_conversation_reads CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.typing_indicators CASCADE;
DROP TABLE IF EXISTS public.user_status CASCADE;

-- 2. CREATE TABLES
CREATE TABLE public.conversations (
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

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional but good for direct lookups
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE TABLE public.user_conversation_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, conversation_id)
);

CREATE TABLE public.user_status (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    status_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, target_user_id)
);

-- 3. INDEXES
CREATE INDEX idx_conversations_user_one ON conversations(user_one_id);
CREATE INDEX idx_conversations_user_two ON conversations(user_two_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- 4. FUNCTIONS & TRIGGERS
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

CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    conversation_id UUID,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_picture TEXT,
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
        c.last_message,
        c.last_message_at,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != p_user_id AND m.read_at IS NULL) as unread_count,
        COALESCE(s.is_online, false) as is_online
    FROM conversations c
    JOIN profiles p ON p.user_id = (CASE WHEN c.user_one_id = p_user_id THEN c.user_two_id ELSE c.user_one_id END)
    LEFT JOIN user_status s ON s.user_id = p.user_id
    WHERE (c.user_one_id = p_user_id AND c.deleted_by_user_one = FALSE) 
       OR (c.user_two_id = p_user_id AND c.deleted_by_user_two = FALSE)
    ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_user_id UUID, p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages SET read_at = NOW(), status = 'read' WHERE conversation_id = p_conversation_id AND sender_id != p_user_id AND read_at IS NULL;
    INSERT INTO user_conversation_reads (user_id, conversation_id, last_read_at)
    VALUES (p_user_id, p_conversation_id, NOW())
    ON CONFLICT (user_id, conversation_id) DO UPDATE SET last_read_at = NOW(), updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REALTIME
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.user_status REPLICA IDENTITY FULL;
ALTER TABLE public.typing_indicators REPLICA IDENTITY FULL;

DO $$
DECLARE tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['conversations', 'messages', 'user_status', 'typing_indicators']) LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = tbl) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
        END IF;
    END LOOP;
END $$;

-- 6. ENABLE RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conversation_reads ENABLE ROW LEVEL SECURITY;

-- Conversations
CREATE POLICY "conv_access" ON public.conversations FOR ALL USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

-- Messages
CREATE POLICY "msg_select" ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND (user_one_id = auth.uid() OR user_two_id = auth.uid()))
);
CREATE POLICY "msg_insert" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND (user_one_id = auth.uid() OR user_two_id = auth.uid()))
);

-- Status & Typing
CREATE POLICY "status_select" ON public.user_status FOR SELECT USING (true);
CREATE POLICY "status_upsert" ON public.user_status FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "typing_select" ON public.typing_indicators FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_user_id);
CREATE POLICY "typing_upsert" ON public.typing_indicators FOR ALL USING (auth.uid() = user_id);

-- Read Status
CREATE POLICY "read_access" ON public.user_conversation_reads FOR ALL USING (auth.uid() = user_id);
