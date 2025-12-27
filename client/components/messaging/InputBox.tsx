import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Smile, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => Promise<void> | void;
};

export const InputBox: React.FC<Props> = ({ disabled, onSend }) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const value = text.trim();
    if (!value || disabled || busy) return;
    setBusy(true);
    try {
      setText("");
      await onSend(value);
    } finally {
      setBusy(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

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
              className="w-full px-4 py-3 bg-transparent border-none resize-none focus:outline-none placeholder-gray-500 text-sm leading-relaxed max-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={submit}
          disabled={disabled || busy || !text.trim()}
          className={cn(
            "bg-primary hover:bg-primary/90 text-white rounded-full p-3 transition-all duration-200",
            busy && "opacity-50 cursor-not-allowed",
            !text.trim() && "opacity-0 scale-90 pointer-events-none"
          )}
        >
          {busy ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};


