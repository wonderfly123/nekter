import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export function MessageBubble({ content, role, timestamp }: MessageBubbleProps) {
  const isBarry = role === 'assistant';

  // Format timestamp
  const formattedTime = new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'flex gap-4 max-w-[85%]',
        isBarry ? 'self-start' : 'self-end flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0',
          isBarry
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
            : 'bg-gray-200 text-gray-900'
        )}
      >
        {isBarry ? 'B' : 'You'}
      </div>

      {/* Message Content */}
      <div className="flex-1">
        <div
          className={cn(
            'rounded-xl px-5 py-4 text-[15px] leading-relaxed',
            isBarry
              ? 'bg-amber-50 border border-amber-100 text-gray-900'
              : 'bg-gray-100 text-gray-900'
          )}
        >
          {content}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
