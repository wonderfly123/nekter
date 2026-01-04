'use client';

import { Plus } from 'lucide-react';
import { ChatHistoryItem } from './chat-history-item';
import { ChatSessionWithPreview } from '@/lib/supabase/types';

interface ChatHistorySidebarProps {
  sessions: ChatSessionWithPreview[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ChatHistorySidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
}: ChatHistorySidebarProps) {
  // Group sessions by time
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);

  const todaySessions = sessions.filter(
    (s) => new Date(s.last_message_at) >= today
  );
  const yesterdaySessions = sessions.filter(
    (s) =>
      new Date(s.last_message_at) >= yesterday &&
      new Date(s.last_message_at) < today
  );
  const last7DaysSessions = sessions.filter(
    (s) =>
      new Date(s.last_message_at) >= last7Days &&
      new Date(s.last_message_at) < yesterday
  );
  const olderSessions = sessions.filter(
    (s) => new Date(s.last_message_at) < last7Days
  );

  return (
    <div className="w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto p-2">
        {todaySessions.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 px-3 py-2">
              Today
            </div>
            {todaySessions.map((session) => (
              <ChatHistoryItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onClick={() => onSessionSelect(session.id)}
              />
            ))}
          </div>
        )}

        {yesterdaySessions.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 px-3 py-2">
              Yesterday
            </div>
            {yesterdaySessions.map((session) => (
              <ChatHistoryItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onClick={() => onSessionSelect(session.id)}
              />
            ))}
          </div>
        )}

        {last7DaysSessions.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 px-3 py-2">
              Last 7 Days
            </div>
            {last7DaysSessions.map((session) => (
              <ChatHistoryItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onClick={() => onSessionSelect(session.id)}
              />
            ))}
          </div>
        )}

        {olderSessions.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 px-3 py-2">
              Older
            </div>
            {olderSessions.map((session) => (
              <ChatHistoryItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onClick={() => onSessionSelect(session.id)}
              />
            ))}
          </div>
        )}

        {sessions.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No chat history yet
          </div>
        )}
      </div>
    </div>
  );
}
