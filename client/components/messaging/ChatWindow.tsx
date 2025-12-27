import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/unified-messaging.service";
import { Check, CheckCheck } from "lucide-react";

type Props = {
  currentUserId: string;
  otherProfile: any;
  messages: Message[];
};

export const ChatWindow: React.FC<Props> = ({ currentUserId, otherProfile, messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const sentByMe = lastMessage?.sender_id === currentUserId;

    if (isNearBottom.current || sentByMe) {
      scrollToBottom(sentByMe ? "smooth" : "auto");
    }
  }, [messages.length, currentUserId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    isNearBottom.current = distanceToBottom < 100;
  };

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
    <div className="flex-1 min-h-0 flex flex-col bg-gray-50 relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
      >
        {messageGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100">
              <img
                src={otherProfile?.profile_picture ? `${otherProfile.profile_picture}?t=${Date.now()}` : ""}
                alt={otherProfile?.name || "User"}
                className="w-12 h-12 rounded-full object-cover shadow-sm"
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
                <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-gray-200/50">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                    {new Date(group.date).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                {group.messages.map((message, index) => {
                  const isOwn = message.sender_id === currentUserId;
                  const prevMessage = index > 0 ? group.messages[index - 1] : null;
                  const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null;
                  const isFirstInGroup = !prevMessage || prevMessage.sender_id !== message.sender_id;
                  const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id;

                  return (
                    <div key={message.id} className={cn("flex items-end space-x-2", isOwn ? "justify-end" : "justify-start")}>
                      {!isOwn && (
                        <div className="w-8 h-8 flex-shrink-0 mb-5">
                          {isLastInGroup && (
                            <img
                              src={otherProfile?.profile_picture ? `${otherProfile.profile_picture}?t=${Date.now()}` : ""}
                              alt={otherProfile?.name || "User"}
                              className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-gray-200"
                            />
                          )}
                        </div>
                      )}

                      <div className={cn("max-w-[85%] sm:max-w-[80%] lg:max-w-[70%]", isOwn ? "order-1" : "order-2")}>
                        <div
                          className={cn(
                            "px-4 py-2.5 transition-all duration-200",
                            isOwn
                              ? "bg-primary text-white shadow-md shadow-green-900/10"
                              : "bg-white text-gray-900 border border-gray-200 shadow-sm",
                            isFirstInGroup && isLastInGroup
                              ? "rounded-2xl"
                              : isFirstInGroup
                                ? isOwn
                                  ? "rounded-2xl rounded-br-none"
                                  : "rounded-2xl rounded-bl-none"
                                : isLastInGroup
                                  ? isOwn
                                    ? "rounded-2xl rounded-tr-none"
                                    : "rounded-2xl rounded-tl-none"
                                  : isOwn
                                    ? "rounded-r-md rounded-l-2xl"
                                    : "rounded-l-md rounded-r-2xl"
                          )}
                        >
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>

                        {isLastInGroup && (
                          <div className={cn("flex items-center mt-1.5 space-x-1.5 opacity-70", isOwn ? "justify-end" : "justify-start")}>
                            <span className="text-[10px] font-medium text-gray-500">
                              {formatTime(message.created_at)}
                            </span>
                            {isOwn && (
                              <div className={cn(
                                "flex items-center",
                                message.read_at ? "text-green-600" : "text-gray-400"
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

        {/* Infinite Scroll / End Marker */}
        <div className="h-4 w-full" />
      </div>
    </div>
  );
};

