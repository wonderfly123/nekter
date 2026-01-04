import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
}

export function MessageBubble({ content, role }: MessageBubbleProps) {
  const isBarry = role === 'assistant';

  return (
    <div className="px-6 py-4">
      <div className="max-w-3xl mx-auto flex gap-3">
        {/* Avatar */}
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            isBarry
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          {isBarry ? (
            <Sparkles className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">
              {isBarry ? 'Barry' : 'You'}
            </span>
          </div>
          <div
            className={cn(
              'text-[15px] leading-relaxed whitespace-pre-wrap',
              isBarry
                ? 'text-gray-700 bg-gray-50 rounded-lg rounded-tl-none px-4 py-3 border border-gray-100'
                : 'text-gray-900'
            )}
          >
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
