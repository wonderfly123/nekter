'use client';

import { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Ask Barry anything about your accounts, health scores, expansion opportunities...',
}: ChatInputProps) {

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      onChange('');
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full min-h-[60px] max-h-[120px] px-3.5 py-3 border border-gray-300 rounded-lg font-sans text-[15px] resize-y focus:outline-none focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
