import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { InputBox } from "@/components/messaging/InputBox";
import { Search, ArrowLeft, MoreVertical, Phone, Video, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messagingService, Message, Conversation } from "@/lib/unified-messaging.service";
import { supabase } from "@/lib/supabase";

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const currentUserId = user?.id || "";

  // Initialize messaging system
  useEffect(() => {
    if (!user?.id) return;

    const initializeMessaging = async () => {
      setLoading(true);

      // Update user status to online
      await messagingService.updateUserStatus(user.id, true);

      // Load conversations
      const convs = await messagingService.getConversations(user.id);
      setConversations(convs);

      setLoading(false);

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
              profile_picture: targetProfile.profile_picture
            },
            unread_count: 0,
            is_online: false
          };
          setConversations(prev => [newConversation, ...prev]);
        }
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
          table: 'conversations',
          filter: `user_one_id=eq.${user.id},user_two_id=eq.${user.id}`
        },
        async () => {
          // Refresh conversations when any conversation changes
          const convs = await messagingService.getConversations(user.id);
          setConversations(convs);
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

    // Subscribe to typing indicators
    const unsubscribeTyping = messagingService.subscribeToTyping(user.id, (userId, isTyping) => {
      // IMPORTANT: Ignore typing events from current user (don't show typing indicator for yourself)
      if (userId === user.id) return;

      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Cleanup on unmount
    return () => {
      messagingService.updateUserStatus(user.id, false);
      supabase.removeChannel(conversationChannel);
      unsubscribeStatus();
      unsubscribeTyping();
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
        setMessages(prev => [...prev, message]);
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
        profile_picture: user.user_metadata?.profile_picture
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
    if (!selectedConversation || !user?.id) return;

    const otherUserId = selectedConversation.user_one_id === user.id
      ? selectedConversation.user_two_id
      : selectedConversation.user_one_id;

    messagingService.sendTypingIndicator(user.id, otherUserId, isTyping);
  };

  if (!user?.id) {
    navigate("/signin");
    return null;
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
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Messages
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`w-80 bg-white/60 backdrop-blur-sm border-r border-gray-200/50 flex flex-col ${selectedConversationId ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search */}
          <div className="p-4 border-b border-gray-100/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-blue-500" />
                </div>
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
                        src={conversation.other_user.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
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
                          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium">
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

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedConversationId ? 'flex' : 'hidden lg:flex'}`}>
          {!selectedConversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white/50 to-gray-50/50 text-center px-8">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <Search className="w-12 h-12 text-blue-500" />
              </div>
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
                      src={selectedConversation?.other_user.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
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
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <Info className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <ChatWindow
                currentUserId={currentUserId}
                otherProfile={selectedConversation?.other_user}
                messages={messages}
                typingUsers={typingUsers}
              />

              <InputBox
                onSend={handleSendMessage}
                onTyping={handleTyping}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;