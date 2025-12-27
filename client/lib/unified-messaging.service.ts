import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  conversation_id?: string;
  sender_id: string;
  receiver_id?: string;
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
  status?: 'sent' | 'delivered' | 'read';
  created_at: string;
  updated_at?: string;
  read_at?: string;
  sender?: {
    id: string;
    name: string;
    profile_picture?: string;
  };
  receiver?: {
    id: string;
    name: string;
    profile_picture?: string;
  };
}

export interface Conversation {
  id: string;
  user_one_id: string;
  user_two_id: string;
  last_message?: string;
  last_message_at?: string;
  other_user: {
    user_id: string;
    name: string;
    profile_picture?: string;
  };
  unread_count: number;
  is_online?: boolean;
}

export interface UserStatus {
  user_id: string;
  is_online: boolean;
  last_seen?: string;
  status_message?: string;
}

class UnifiedMessagingService {
  private channels: Map<string, RealtimeChannel> = new Map();

  // Get or create conversation between two users
  async getOrCreateConversation(userOneId: string, userTwoId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_one_id: userOneId,
        p_user_two_id: userTwoId
      });

      if (error) throw error;
      return data as string;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  // Get user's conversations (OPTIMIZED - single query instead of N+1)
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_conversations', {
        p_user_id: userId
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.conversation_id,
        user_one_id: userId,
        user_two_id: row.other_user_id,
        last_message: row.last_message,
        last_message_at: row.last_message_at,
        other_user: {
          user_id: row.other_user_id,
          name: row.other_user_name || 'Unknown User',
          profile_picture: row.other_user_picture
        },
        unread_count: Number(row.unread_count) || 0,
        is_online: row.is_online || false
      }));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Get messages for a conversation (OPTIMIZED - single query with JOIN)
  async getMessages(conversationId: string, limit = 200, offset = 0): Promise<Message[]> {
    try {
      const { data, error } = await supabase.rpc('get_conversation_messages', {
        p_conversation_id: conversationId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        conversation_id: row.conversation_id,
        sender_id: row.sender_id,
        content: row.content,
        message_type: row.message_type,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        read_at: row.read_at,
        sender: row.sender_name ? {
          id: row.sender_id,
          name: row.sender_name,
          profile_picture: row.sender_picture
        } : undefined
      })).reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Send a message
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message | null> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim(),
          message_type: 'text',
          status: 'sent'
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          receiver_id,
          content,
          message_type,
          status,
          created_at,
          updated_at,
          read_at
        `)
        .single();

      if (error) throw error;

      // Get sender profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, name, profile_picture')
        .eq('user_id', senderId)
        .single();

      return {
        ...message,
        sender: profile ? {
          id: senderId,
          name: profile.name,
          profile_picture: profile.profile_picture
        } : undefined
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Mark message as read
  async markMessageRead(messageId: string): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Mark all messages in conversation as read
  async markAllMessagesRead(conversationId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Soft delete conversation
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      const { data: conv } = await supabase
        .from('conversations')
        .select('user_one_id, user_two_id')
        .eq('id', conversationId)
        .single();

      if (!conv) return;

      const column = conv.user_one_id === userId
        ? 'deleted_by_user_one'
        : 'deleted_by_user_two';

      await supabase
        .from('conversations')
        .update({ [column]: true })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  // Update user status
  async updateUserStatus(userId: string, isOnline: boolean, statusMessage?: string): Promise<void> {
    try {
      await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          status_message: statusMessage
        });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  // Mark conversation as read
  async markConversationAsRead(userId: string, conversationId: string): Promise<void> {
    try {
      await supabase
        .from('user_conversation_reads')
        .upsert({
          user_id: userId,
          conversation_id: conversationId,
          last_read_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }

  // Send typing indicator with auto-clear timeout
  async sendTypingIndicator(userId: string, targetUserId: string, isTyping: boolean): Promise<void> {
    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          user_id: userId,
          target_user_id: targetUserId,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        });

      // Auto-clear typing indicator after 3 seconds
      if (isTyping) {
        setTimeout(async () => {
          await supabase
            .from('typing_indicators')
            .update({ is_typing: false })
            .eq('user_id', userId)
            .eq('target_user_id', targetUserId);
        }, 3000);
      }
    } catch (error) {
      // Silently fail - typing indicators are non-critical
      if (import.meta.env.DEV) {
        console.error('Error sending typing indicator:', error);
      }
    }
  }

  // Subscribe to messages for a conversation
  subscribeToMessages(conversationId: string, onMessage: (message: Message) => void): () => void {
    const channelName = `messages_${conversationId}`;

    if (this.channels.has(channelName)) {
      return () => { };
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const message = payload.new as any;

          // Get sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, name, profile_picture')
            .eq('user_id', message.sender_id)
            .single();

          onMessage({
            ...message,
            sender: profile ? {
              id: message.sender_id,
              name: profile.name,
              profile_picture: profile.profile_picture
            } : undefined
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  // Subscribe to user status changes
  subscribeToUserStatus(onStatusChange: (status: UserStatus) => void): () => void {
    const channelName = 'user_status_changes';

    if (this.channels.has(channelName)) {
      return () => { };
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_status'
        },
        (payload) => {
          const status = payload.new as any;
          onStatusChange({
            user_id: status.user_id,
            is_online: status.is_online,
            last_seen: status.last_seen,
            status_message: status.status_message
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    };
  }

  // Subscribe to typing indicators
  subscribeToTyping(userId: string, onTyping: (userId: string, isTyping: boolean) => void): () => void {
    const channelName = `typing_${userId}`;

    if (this.channels.has(channelName)) {
      return () => { };
    }

    try {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_indicators',
            filter: `target_user_id=eq.${userId}`
          },
          (payload) => {
            try {
              const typing = payload.new as any;
              if (typing && typing.user_id && typeof typing.is_typing === 'boolean') {
                onTyping(typing.user_id, typing.is_typing);
              }
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error('Error processing typing indicator:', error);
              }
            }
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);

      return () => {
        supabase.removeChannel(channel);
        this.channels.delete(channelName);
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error subscribing to typing indicators:', error);
      }
      return () => { };
    }
  }

  // Get last read time for a conversation
  private async getLastReadTime(userId: string, conversationId: string): Promise<string> {
    try {
      const { data } = await supabase
        .from('user_conversation_reads')
        .select('last_read_at')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .single();

      return data?.last_read_at || '1970-01-01T00:00:00Z';
    } catch {
      return '1970-01-01T00:00:00Z';
    }
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const messagingService = new UnifiedMessagingService();