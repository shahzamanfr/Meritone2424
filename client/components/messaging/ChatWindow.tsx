import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/unified-messaging.service";
import { Check, CheckCheck } from "lucide-react";

type Props = {
  currentUserId: string;
  otherProfile: any;
  messages: Message[];
  typingUsers?: Set<string>;
};

export const ChatWindow: React.FC<Props> = ({ currentUserId, otherProfile, messages, typingUsers = new Set() }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 48) {
      return "Yesterday " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {messageGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <img
                src={otherProfile?.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                alt={otherProfile?.name || "User"}
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start a conversation with {otherProfile?.name || "User"}
            </h3>
            <p className="text-gray-600 text-sm">Send a message to begin your collaboration</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              {/* Date Separator */}
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white px-3 py-1 rounded-full shadow-sm border">
                  <span className="text-xs font-medium text-gray-600">
                    {new Date(group.date).toLocaleDateString([], {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-2">
                {group.messages.map((message, index) => {
                  const isOwn = message.sender_id === currentUserId;
                  const prevMessage = index > 0 ? group.messages[index - 1] : null;
                  const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null;
                  const isFirstInGroup = !prevMessage || prevMessage.sender_id !== message.sender_id;
                  const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id;

                  return (
                    <div key={message.id} className={cn("flex items-end space-x-2", isOwn ? "justify-end" : "justify-start")}>
                      {!isOwn && (
                        <div className="w-8 h-8 flex-shrink-0">
                          {isLastInGroup && (
                            <img
                              src={otherProfile?.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                              alt={otherProfile?.name || "User"}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      <div className={cn("max-w-xs sm:max-w-md lg:max-w-lg", isOwn ? "order-1" : "order-2")}>
                        <div
                          className={cn(
                            "px-4 py-2 shadow-sm",
                            isOwn
                              ? "bg-primary text-white"
                              : "bg-white text-gray-900 border border-gray-200",
                            isFirstInGroup && isLastInGroup
                              ? "rounded-2xl"
                              : isFirstInGroup
                                ? isOwn
                                  ? "rounded-2xl rounded-br-md"
                                  : "rounded-2xl rounded-bl-md"
                                : isLastInGroup
                                  ? isOwn
                                    ? "rounded-2xl rounded-tr-md"
                                    : "rounded-2xl rounded-tl-md"
                                  : isOwn
                                    ? "rounded-r-2xl rounded-l-md"
                                    : "rounded-l-2xl rounded-r-md"
                          )}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>

                        {isLastInGroup && (
                          <div className={cn("flex items-center mt-1 space-x-1", isOwn ? "justify-end" : "justify-start")}>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.created_at)}
                            </span>
                            {isOwn && (
                              <div className={cn(
                                "flex items-center",
                                message.read_at ? "text-blue-500" : "text-gray-400"
                              )}>
                                {message.read_at ? (
                                  <CheckCheck className="w-3.5 h-3.5" />
                                ) : message.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {isOwn && <div className="w-8 h-8 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.has(otherProfile?.user_id) && (
          <div className="flex justify-start px-4 pb-4">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-gray-200/50">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
};

