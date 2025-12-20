-- RLS policies for conversations and messages

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_conversation_reads ENABLE ROW LEVEL SECURITY;

-- Helper policy: Only participants can select a conversation
DROP POLICY IF EXISTS conversations_select ON conversations;
CREATE POLICY conversations_select ON conversations
FOR SELECT
USING (
  auth.uid() = user_one_id OR auth.uid() = user_two_id
);

-- Helper policy: Only participants can insert a conversation (via RPC normally)
DROP POLICY IF EXISTS conversations_insert ON conversations;
CREATE POLICY conversations_insert ON conversations
FOR INSERT
WITH CHECK (
  auth.uid() = user_one_id OR auth.uid() = user_two_id
);

-- Prevent updates by default except via triggers/RPC (optional restrictive)
DROP POLICY IF EXISTS conversations_update ON conversations;
CREATE POLICY conversations_update ON conversations
FOR UPDATE
USING (
  auth.uid() = user_one_id OR auth.uid() = user_two_id
)
WITH CHECK (
  auth.uid() = user_one_id OR auth.uid() = user_two_id
);

-- Messages: Only participants of the parent conversation can read/insert
DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_one_id = auth.uid() OR c.user_two_id = auth.uid())
  )
);

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages
FOR INSERT
WITH CHECK (
  -- Sender must be the authed user and belong to the conversation
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
      AND (c.user_one_id = auth.uid() OR c.user_two_id = auth.uid())
  )
);

-- Optional updates (e.g., status/read receipts on message rows) - restrict to participants
DROP POLICY IF EXISTS messages_update ON messages;
CREATE POLICY messages_update ON messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_one_id = auth.uid() OR c.user_two_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_one_id = auth.uid() OR c.user_two_id = auth.uid())
  )
);

-- Read receipts: Only owner can read/insert/update their read marker
DROP POLICY IF EXISTS reads_select ON user_conversation_reads;
CREATE POLICY reads_select ON user_conversation_reads
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS reads_upsert ON user_conversation_reads;
CREATE POLICY reads_upsert ON user_conversation_reads
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS reads_update ON user_conversation_reads;
CREATE POLICY reads_update ON user_conversation_reads
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
