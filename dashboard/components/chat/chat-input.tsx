'use client';

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask Barry anything about your accounts, health scores, expansion opportunities...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-6 border-t border-gray-200 bg-gray-50">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full min-h-[60px] max-h-[120px] px-3.5 py-3 border border-gray-300 rounded-lg font-sans text-[15px] resize-y focus:outline-none focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="px-6 py-3.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg font-semibold text-[15px] flex items-center gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <span>Send</span>
          <Send className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}
