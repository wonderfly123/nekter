import { cn } from '@/lib/utils';
import { ChatSessionWithPreview } from '@/lib/supabase/types';

interface ChatHistoryItemProps {
  session: ChatSessionWithPreview;
  isActive: boolean;
  onClick: () => void;
}

export function ChatHistoryItem({ session, isActive, onClick }: ChatHistoryItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-3 rounded-lg mb-1 transition-all hover:bg-gray-100',
        isActive && 'bg-amber-50 border-l-2 border-amber-500'
      )}
    >
      <div className="font-semibold text-sm text-gray-900 mb-1 truncate">
        {session.title}
      </div>
      <div className="text-xs text-gray-500 truncate">
        {session.preview}
      </div>
    </button>
  );
}
