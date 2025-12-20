import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Smile, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => Promise<void> | void;
  onTyping?: (isTyping: boolean) => void;
};

export const InputBox: React.FC<Props> = ({ disabled, onSend, onTyping }) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const value = text.trim();
    if (!value || disabled || busy) return;
    setBusy(true);
    setIsTyping(false);
    try {
      setText("");
      await onSend(value);
    } finally {
      setBusy(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const hasText = e.target.value.length > 0;
    setIsTyping(hasText);
    
    // Send typing indicator
    if (onTyping) {
      onTyping(hasText);
    }
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    if (textareaRef.current && text === '') {
      textareaRef.current.style.height = 'auto';
    }
  }, [text]);

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-end space-x-3">
        {/* Attachment Button */}
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 p-2"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <div className="relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="Type a message..."
              rows={1}
              disabled={disabled}
              className="w-full px-4 py-3 pr-12 bg-transparent border-none resize-none focus:outline-none placeholder-gray-500 text-sm leading-relaxed max-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            
            {/* Emoji Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
              disabled={disabled}
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Send/Voice Button */}
        {text.trim() ? (
          <Button
            onClick={submit}
            disabled={disabled || busy || !text.trim()}
            className={cn(
              "bg-primary hover:bg-primary/90 text-white rounded-full p-3 transition-all duration-200",
              busy && "opacity-50 cursor-not-allowed"
            )}
          >
            {busy ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 p-3 rounded-full hover:bg-gray-100"
            disabled={disabled}
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>
      
      {/* Typing Indicator */}
      {isTyping && (
        <div className="mt-2 text-xs text-gray-500 px-4">
          <span className="inline-flex items-center space-x-1">
            <span>Typing</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </span>
        </div>
      )}
    </div>
  );
};


