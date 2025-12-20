-- Direct Messaging System Schema
-- Scalable architecture for thousands of conversations and messages

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_one_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    user_two_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one conversation exists between two users
    CONSTRAINT unique_conversation UNIQUE (user_one_id, user_two_id),
    -- Prevent self-conversations
    CONSTRAINT no_self_conversation CHECK (user_one_id != user_two_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure content is not empty
    CONSTRAINT non_empty_content CHECK (length(trim(content)) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_one ON conversations(user_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_two ON conversations(user_two_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user_one_id, user_two_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Function to update conversation's last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET 
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation when message is inserted
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_user_one_id UUID,
    p_user_two_id UUID
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    -- Check if conversation already exists (both directions)
    SELECT id INTO conversation_id
    FROM conversations
    WHERE (user_one_id = p_user_one_id AND user_two_id = p_user_two_id)
       OR (user_one_id = p_user_two_id AND user_two_id = p_user_one_id);
    
    -- If conversation exists, return it
    IF conversation_id IS NOT NULL THEN
        RETURN conversation_id;
    END IF;
    
    -- Create new conversation (ensure consistent ordering)
    INSERT INTO conversations (user_one_id, user_two_id)
    VALUES (
        LEAST(p_user_one_id, p_user_two_id),
        GREATEST(p_user_one_id, p_user_two_id)
    )
    RETURNING id INTO conversation_id;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation participants
CREATE OR REPLACE FUNCTION get_conversation_participants(p_conversation_id UUID)
RETURNS TABLE(user_id UUID, name TEXT, profile_picture TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.user_one_id as user_id,
        p1.name,
        p1.profile_picture
    FROM conversations c
    JOIN profiles p1 ON c.user_one_id = p1.user_id
    WHERE c.id = p_conversation_id
    
    UNION ALL
    
    SELECT 
        c.user_two_id as user_id,
        p2.name,
        p2.profile_picture
    FROM conversations c
    JOIN profiles p2 ON c.user_two_id = p2.user_id
    WHERE c.id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's conversations with pagination
CREATE OR REPLACE FUNCTION get_user_conversations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    conversation_id UUID,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_profile_picture TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as conversation_id,
        CASE 
            WHEN c.user_one_id = p_user_id THEN c.user_two_id
            ELSE c.user_one_id
        END as other_user_id,
        CASE 
            WHEN c.user_one_id = p_user_id THEN p2.name
            ELSE p1.name
        END as other_user_name,
        CASE 
            WHEN c.user_one_id = p_user_id THEN p2.profile_picture
            ELSE p1.profile_picture
        END as other_user_profile_picture,
        c.last_message,
        c.last_message_at,
        COALESCE(unread.unread_count, 0) as unread_count
    FROM conversations c
    LEFT JOIN profiles p1 ON c.user_one_id = p1.user_id
    LEFT JOIN profiles p2 ON c.user_two_id = p2.user_id
    LEFT JOIN (
        SELECT 
            conversation_id,
            COUNT(*) as unread_count
        FROM messages
        WHERE sender_id != p_user_id
        AND created_at > (
            SELECT COALESCE(last_read_at, '1970-01-01'::timestamptz)
            FROM user_conversation_reads
            WHERE user_id = p_user_id AND conversation_id = messages.conversation_id
        )
        GROUP BY conversation_id
    ) unread ON c.id = unread.conversation_id
    WHERE c.user_one_id = p_user_id OR c.user_two_id = p_user_id
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get messages for a conversation with pagination
CREATE OR REPLACE FUNCTION get_conversation_messages(
    p_conversation_id UUID,
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    message_id UUID,
    sender_id UUID,
    sender_name TEXT,
    sender_profile_picture TEXT,
    content TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Verify user has access to this conversation
    IF NOT EXISTS (
        SELECT 1 FROM conversations 
        WHERE id = p_conversation_id 
        AND (user_one_id = p_user_id OR user_two_id = p_user_id)
    ) THEN
        RAISE EXCEPTION 'Access denied to conversation';
    END IF;
    
    RETURN QUERY
    SELECT 
        m.id as message_id,
        m.sender_id,
        p.name as sender_name,
        p.profile_picture as sender_profile_picture,
        m.content,
        m.created_at
    FROM messages m
    JOIN profiles p ON m.sender_id = p.user_id
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Read receipts table
CREATE TABLE IF NOT EXISTS user_conversation_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, conversation_id)
);

-- Index for read receipts
CREATE INDEX IF NOT EXISTS idx_user_conversation_reads_user ON user_conversation_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_conversation_reads_conversation ON user_conversation_reads(conversation_id);

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
    p_user_id UUID,
    p_conversation_id UUID
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_conversation_reads (user_id, conversation_id, last_read_at)
    VALUES (p_user_id, p_conversation_id, NOW())
    ON CONFLICT (user_id, conversation_id)
    DO UPDATE SET 
        last_read_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
