import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { InputBox } from "@/components/messaging/InputBox";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messagingService, Message, Conversation } from "@/lib/unified-messaging.service";
import { supabase } from "@/lib/supabase";
import { EmailVerificationNotice } from "@/components/EmailVerificationNotice";

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { user, isEmailVerified, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const currentUserId = user?.id || "";

  // Initialize messaging system
  useEffect(() => {
    if (!user?.id) return;

    const initializeMessaging = async () => {
      try {
        setLoading(true);

        // Update user status to online
        await messagingService.updateUserStatus(user.id, true);

        // Load conversations
        const convs = await messagingService.getConversations(user.id);
        setConversations(convs);

        // Check if we should open a specific conversation
        const openWithUserId = location?.state?.openWithUserId;
        if (openWithUserId && openWithUserId !== user.id) {
          // Get or create the conversation
          const conversationId = await messagingService.getOrCreateConversation(user.id, openWithUserId);
          setSelectedConversationId(conversationId);

          // Fetch the target user's profile for display
          const { data: targetProfile } = await supabase
            .from('profiles')
            .select('user_id, name, profile_picture')
            .eq('user_id', openWithUserId)
            .single();

          // Check if conversation already exists in list
          const existingConv = convs.find(c => c.id === conversationId);

          if (!existingConv && targetProfile) {
            // Add new conversation to the list with target user's info
            const newConversation: Conversation = {
              id: conversationId,
              user_one_id: user.id,
              user_two_id: openWithUserId,
              last_message: undefined,
              last_message_at: undefined,
              other_user: {
                user_id: targetProfile.user_id,
                name: targetProfile.name || 'Unknown User',
                profile_picture: targetProfile.profile_picture ? `${targetProfile.profile_picture}?t=${Date.now()}` : undefined
              },
              unread_count: 0,
              is_online: false
            };
            setConversations(prev => [newConversation, ...prev]);
          }
        }
      } catch (error) {
        console.error("Failed to initialize messaging:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeMessaging();

    // Subscribe to conversation changes for real-time updates
    const conversationChannel = supabase
      .channel('conversation_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
          // We filter client-side since OR conditions are complex in filter strings
        },
        async (payload: any) => {
          // Only refresh if the change belongs to the current user
          const { user_one_id, user_two_id } = payload.new || payload.old || {};
          if (user_one_id === user.id || user_two_id === user.id) {
            const convs = await messagingService.getConversations(user.id);
            setConversations(convs);
          }
        }
      )
      .subscribe();

    // Subscribe to user status changes
    const unsubscribeStatus = messagingService.subscribeToUserStatus((status) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status.is_online) {
          newSet.add(status.user_id);
        } else {
          newSet.delete(status.user_id);
        }
        return newSet;
      });

      // Update conversation list with new online status
      setConversations(prev => prev.map(conv =>
        conv.other_user.user_id === status.user_id
          ? { ...conv, is_online: status.is_online }
          : conv
      ));
    });



    // Cleanup on unmount
    return () => {
      messagingService.updateUserStatus(user.id, false);
      supabase.removeChannel(conversationChannel);
      unsubscribeStatus();
      messagingService.cleanup();
    };
  }, [user?.id, location?.state?.openWithUserId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || !user?.id) return;

    const loadMessages = async () => {
      const msgs = await messagingService.getMessages(selectedConversationId);
      setMessages(msgs);

      // Mark all messages as read when opening conversation
      await messagingService.markAllMessagesRead(selectedConversationId, user.id);
    };

    loadMessages();

    // Subscribe to new messages
    const unsubscribe = messagingService.subscribeToMessages(selectedConversationId, (message) => {
      // Only add messages from other users to prevent duplicates
      // (our own messages are already added optimistically)
      if (message.sender_id !== user.id) {
        setMessages(prev => {
          // Prevent duplicates from real-time
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        messagingService.markAllMessagesRead(selectedConversationId, user.id);
      }
    });

    return unsubscribe;
  }, [selectedConversationId, user?.id]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !user?.id) return;

    // Create optimistic message for instant UI feedback
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content: content.trim(),
      message_type: 'text',
      status: 'sent',
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.user_metadata?.name || user.email || 'You',
        profile_picture: user.user_metadata?.profile_picture ? `${user.user_metadata.profile_picture}?t=${Date.now()}` : undefined
      }
    };

    // Add to UI immediately (optimistic update)
    setMessages(prev => [...prev, optimisticMessage]);

    // Update conversation list optimistically
    setConversations(prev => prev.map(conv =>
      conv.id === selectedConversationId
        ? {
          ...conv,
          last_message: content.trim(),
          last_message_at: new Date().toISOString()
        }
        : conv
    ));

    // Send to database
    const message = await messagingService.sendMessage(selectedConversationId, user.id, content);

    if (message) {
      // Replace optimistic message with real one (has proper ID and timestamp)
      setMessages(prev => prev.map(m =>
        m.id === optimisticMessage.id ? message : m
      ));
    } else {
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));

      // Revert conversation list update
      const convs = await messagingService.getConversations(user.id);
      setConversations(convs);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    // Typing indicators removed as requested
  };

  // Wait for auth loading before redirecting
  if (authLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user?.id) {
    navigate("/signin");
    return null;
  }

  if (!isEmailVerified) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Messages
            </h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <EmailVerificationNotice />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Messages
          </h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={cn(
          "w-80 bg-white/60 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-inner transition-all duration-300 min-h-0",
          selectedConversationId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-gray-100/50">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Conversations</h2>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-sm text-gray-500">Start connecting with other professionals</p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`flex items-center p-4 m-1 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/80 ${selectedConversationId === conversation.id
                      ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 shadow-sm"
                      : "hover:shadow-sm"
                      }`}
                  >
                    <div className="relative">
                      <img
                        src={conversation.other_user.profile_picture || ""}
                        alt={conversation.other_user.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                      {conversation.is_online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {conversation.other_user.name}
                        </h3>
                        {conversation.unread_count > 0 && (
                          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {conversation.last_message || "Start a conversation"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {conversation.last_message_at && new Date(conversation.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          "flex-1 flex flex-col min-w-0 bg-white min-h-0 relative",
          selectedConversationId ? "flex" : "hidden md:flex"
        )}>
          {!selectedConversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white/50 to-gray-50/50 text-center px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Messages</h2>
              <p className="text-gray-600 max-w-md leading-relaxed">Select a conversation to start chatting with other professionals and collaborate on exciting projects.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversationId(null)}
                    className="lg:hidden text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="relative">
                    <img
                      src={selectedConversation?.other_user.profile_picture ? `${selectedConversation.other_user.profile_picture}?t=${Date.now()}` : ""}
                      alt={selectedConversation?.other_user.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    {selectedConversation?.is_online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedConversation?.other_user.name}</h3>
                    <p className={`text-sm font-medium ${selectedConversation?.is_online ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedConversation?.is_online ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              <ChatWindow
                currentUserId={currentUserId}
                otherProfile={selectedConversation?.other_user}
                messages={messages}
              />

              <InputBox
                onSend={handleSendMessage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;