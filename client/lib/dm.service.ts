import { supabase } from "@/lib/supabase";

export type ConversationRow = {
  id: string;
  user_one_id: string;
  user_two_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileLite = {
  user_id: string;
  name: string;
  profile_picture: string | null;
};

export type ConversationPreview = {
  conversation_id: string;
  other_user: ProfileLite;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export async function getOrCreateConversation(currentUserId: string, otherUserId: string): Promise<string> {
  // Prefer RPC if available
  try {
    const { data, error } = await supabase.rpc("get_or_create_conversation", {
      p_user_one_id: currentUserId,
      p_user_two_id: otherUserId,
    });
    if (error) throw error;
    return data as string;
  } catch (e: any) {
    // Fallback: deterministic ordering and upsert-like logic
    const [a, b] = [currentUserId, otherUserId].sort();
    // Try find existing
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(user_one_id.eq.${a},user_two_id.eq.${b}),and(user_one_id.eq.${b},user_two_id.eq.${a})`)
      .limit(1)
      .maybeSingle();
    if (existing?.id) return existing.id as string;
    // Create
    const { data: created, error: insertErr } = await supabase
      .from("conversations")
      .insert({ user_one_id: a, user_two_id: b })
      .select("id")
      .single();
    if (insertErr) throw insertErr;
    return created!.id as string;
  }
}

export async function listConversations(currentUserId: string, limit = 20, offset = 0): Promise<ConversationPreview[]> {
  try {
    const { data, error } = await supabase.rpc("get_user_conversations", {
      p_user_id: currentUserId,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    const rows = (data || []) as Array<{
      conversation_id: string;
      other_user_id: string;
      other_user_name: string;
      other_user_profile_picture: string | null;
      last_message: string | null;
      last_message_at: string | null;
      unread_count: number;
    }>;
    return rows.map((r) => ({
      conversation_id: r.conversation_id,
      other_user: { user_id: r.other_user_id, name: r.other_user_name, profile_picture: r.other_user_profile_picture },
      last_message: r.last_message,
      last_message_at: r.last_message_at,
      unread_count: r.unread_count,
    }));
  } catch (e) {
    // Fallback: compute from conversations/messages directly
    const { data: convs } = await supabase
      .from("conversations")
      .select("id,user_one_id,user_two_id,last_message,last_message_at")
      .or(`user_one_id.eq.${currentUserId},user_two_id.eq.${currentUserId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const previews: ConversationPreview[] = [];
    for (const c of (convs || []) as any[]) {
      const otherId = c.user_one_id === currentUserId ? c.user_two_id : c.user_one_id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id,name,profile_picture")
        .eq("user_id", otherId)
        .single();
      // Unread approx: count since last read (if table exists) else 0
      let unread = 0;
      try {
        const { data: rr } = await supabase
          .from("user_conversation_reads")
          .select("last_read_at")
          .eq("user_id", currentUserId)
          .eq("conversation_id", c.id)
          .maybeSingle();
        const lastRead = rr?.last_read_at;
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", currentUserId)
          .gt("created_at", lastRead || "1970-01-01");
        unread = count || 0;
      } catch { }
      previews.push({
        conversation_id: c.id,
        other_user: {
          user_id: profile?.user_id || otherId,
          name: profile?.name || "User",
          profile_picture: profile?.profile_picture || null,
        },
        last_message: c.last_message || null,
        last_message_at: c.last_message_at || null,
        unread_count: unread,
      });
    }
    return previews;
  }
}

export async function fetchMessages(conversationId: string, currentUserId: string, limit = 40, offset = 0): Promise<MessageRow[]> {
  try {
    const { data, error } = await supabase.rpc("get_conversation_messages", {
      p_conversation_id: conversationId,
      p_user_id: currentUserId,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    const rows = (data || []) as Array<{
      message_id: string;
      sender_id: string;
      content: string;
      created_at: string;
    }>;
    return rows
      .map((r) => ({ id: r.message_id, conversation_id: conversationId, sender_id: r.sender_id, content: r.content, created_at: r.created_at }))
      .reverse();
  } catch {
    // Fallback direct query
    const { data } = await supabase
      .from("messages")
      .select("id,conversation_id,sender_id,content,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);
    return (data || []) as MessageRow[];
  }
}

export async function sendMessage(conversationId: string, currentUserId: string, content: string): Promise<MessageRow> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
    .select("id,conversation_id,sender_id,content,created_at")
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export async function markConversationRead(currentUserId: string, conversationId: string): Promise<void> {
  await supabase.rpc("mark_conversation_as_read", { p_user_id: currentUserId, p_conversation_id: conversationId });
}

export function subscribeToConversation(conversationId: string, onInsert: (m: MessageRow) => void) {
  const channel = supabase
    .channel(`conv_${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const row = payload.new as any;
        onInsert({ id: row.id, conversation_id: row.conversation_id, sender_id: row.sender_id, content: row.content, created_at: row.created_at });
      }
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribeToInbox(currentUserId: string, onAnyNewMessage: () => void) {
  const channel = supabase
    .channel(`inbox_${currentUserId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      () => onAnyNewMessage()
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}


