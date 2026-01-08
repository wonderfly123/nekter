'use client';

import { KeyboardEvent, useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

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
    <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-3xl mx-auto flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 min-h-[38px] max-h-[120px] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-sans text-sm resize-none focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="h-[38px] px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg font-medium text-sm flex items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-px transition-all disabled:bg-gray-200 disabled:from-gray-200 disabled:to-gray-200 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed disabled:text-gray-400"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
