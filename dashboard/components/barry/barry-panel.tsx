'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, MoreVertical, MessageSquare, PenSquare, Pencil, Trash2 } from 'lucide-react';
import { useBarryPanelStore } from '@/lib/stores/barry-panel-store';
import { useChatSessions } from '@/hooks/use-chat-sessions';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useSendMessage } from '@/hooks/use-send-message';
import { useDeleteChatSession } from '@/hooks/use-delete-chat-session';
import { useUpdateChatSession } from '@/hooks/use-update-chat-session';
import { createChatSession } from '@/lib/supabase/queries';
import { useAuth } from '@/lib/auth/use-auth';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { QuickActionChips } from '@/components/chat/quick-action-chips';
import { cn } from '@/lib/utils';

export function BarryPanel() {
  const { user } = useAuth();
  const { isOpen, closePanel, activeSessionId, setActiveSessionId } = useBarryPanelStore();
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyMenuRef = useRef<HTMLDivElement>(null);

  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: messages, isLoading: messagesLoading } = useChatMessages(activeSessionId);
  const sendMessage = useSendMessage();
  const deleteSession = useDeleteChatSession();
  const updateSession = useUpdateChatSession();

  // Auto-select first session or create new one
  useEffect(() => {
    if (!sessionsLoading && sessions && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, sessionsLoading, activeSessionId, setActiveSessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Close history menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (historyMenuRef.current && !historyMenuRef.current.contains(event.target as Node)) {
        setShowHistoryMenu(false);
      }
    }
    if (showHistoryMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showHistoryMenu]);

  const handleNewChat = async () => {
    if (!user) return;
    try {
      const emptySession = sessions?.find(session => session.message_count === 0);
      if (emptySession) {
        setActiveSessionId(emptySession.id);
        setShowHistoryMenu(false);
        return;
      }
      const newSession = await createChatSession(user.id, 'New conversation');
      setActiveSessionId(newSession.id);
      setShowHistoryMenu(false);
    } catch (error) {
      console.error('Error creating chat session:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeSessionId) return;

    const isFirstMessage = !messages || messages.length === 0;

    try {
      await sendMessage.mutateAsync({
        sessionId: activeSessionId,
        content,
        role: 'user',
      });

      // Generate title for first message
      if (isFirstMessage) {
        fetch('/api/barry/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.title) {
              updateSession.mutate({ sessionId: activeSessionId, title: data.title });
            }
          })
          .catch(console.error);
      }

      setIsThinking(true);
      setStreamingContent('');

      const response = await fetch('/api/barry/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: content, sessionId: activeSessionId }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      setIsThinking(false);
      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }

      await sendMessage.mutateAsync({
        sessionId: activeSessionId,
        content: fullResponse,
        role: 'assistant',
      });
      setTimeout(() => setStreamingContent(''), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsThinking(false);
      setStreamingContent('');
      await sendMessage.mutateAsync({
        sessionId: activeSessionId,
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
        role: 'assistant',
      });
    }
  };

  const handleQuickActionClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistoryMenu(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right border-l border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-lg text-gray-900">Barry</span>
          </div>

          <div className="flex items-center gap-1">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="New Chat"
            >
              <PenSquare className="w-5 h-5 text-gray-600" />
            </button>

            {/* History Menu */}
            <div className="relative" ref={historyMenuRef}>
              <button
                onClick={() => setShowHistoryMenu(!showHistoryMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Chat History"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>

              {showHistoryMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chat History</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {sessions?.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-gray-500 text-center">No conversations yet</div>
                    ) : (
                      sessions?.map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            'group px-3 py-2.5 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50 last:border-0',
                            session.id === activeSessionId && 'bg-amber-50',
                            editingSessionId !== session.id && 'cursor-pointer'
                          )}
                          onClick={() => {
                            if (editingSessionId !== session.id) {
                              handleSessionSelect(session.id);
                            }
                          }}
                        >
                          <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            {editingSessionId === session.id ? (
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={() => {
                                  if (editingTitle.trim() && editingTitle !== session.title) {
                                    updateSession.mutate({ sessionId: session.id, title: editingTitle.trim() });
                                  }
                                  setEditingSessionId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (editingTitle.trim() && editingTitle !== session.title) {
                                      updateSession.mutate({ sessionId: session.id, title: editingTitle.trim() });
                                    }
                                    setEditingSessionId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingSessionId(null);
                                  }
                                }}
                                autoFocus
                                className="w-full px-2 py-1 text-sm border border-amber-500 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <>
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {session.title}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {session.preview}
                                </div>
                              </>
                            )}
                          </div>
                          {editingSessionId !== session.id && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTitle(session.title);
                                  setEditingSessionId(session.id);
                                }}
                                className="p-1 rounded hover:bg-gray-200"
                                title="Rename"
                              >
                                <Pencil className="w-3.5 h-3.5 text-gray-500" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this conversation?')) {
                                    deleteSession.mutate(session.id);
                                    if (session.id === activeSessionId) {
                                      setActiveSessionId(null);
                                    }
                                  }
                                }}
                                className="p-1 rounded hover:bg-red-100"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={closePanel}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          {messagesLoading ? (
            <div className="text-center text-gray-500 py-8">Loading messages...</div>
          ) : !activeSessionId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg font-semibold mb-2">Welcome to Barry!</p>
                <p className="text-sm">Start a new conversation to get started.</p>
              </div>
            </div>
          ) : messages && messages.length === 0 ? (
            <QuickActionChips onActionClick={handleQuickActionClick} />
          ) : messages && messages.length > 0 ? (
            <div className="py-2">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  role={message.role}
                  timestamp={message.created_at}
                />
              ))}
              {isThinking && (
                <div className="px-6 py-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">Barry</span>
                      </div>
                      <div className="text-[15px] leading-relaxed text-gray-700 bg-gray-50 rounded-lg rounded-tl-none px-4 py-3 border border-gray-100">
                        <span className="bg-gradient-to-r from-orange-500 from-0% via-amber-200 via-50% to-orange-500 to-100% bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
                          the bees are buzzing...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {streamingContent && (
                <MessageBubble content={streamingContent} role="assistant" />
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 py-8">No messages yet</div>
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          disabled={!activeSessionId || sendMessage.isPending}
        />
      </div>
    </>
  );
}
