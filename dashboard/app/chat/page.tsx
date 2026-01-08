'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AnimatedGradientBackground } from '@/components/portfolio/animated-gradient-bg';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { QuickActionChips } from '@/components/chat/quick-action-chips';
import { useChatSessions } from '@/hooks/use-chat-sessions';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useSendMessage } from '@/hooks/use-send-message';
import { useDeleteChatSession } from '@/hooks/use-delete-chat-session';
import { useUpdateChatSession } from '@/hooks/use-update-chat-session';
import { createChatSession } from '@/lib/supabase/queries';
import { useAuth } from '@/lib/auth/use-auth';

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatContent />
    </AuthGuard>
  );
}

function ChatContent() {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [sessions, sessionsLoading, activeSessionId]);

  // Auto-scroll to bottom when new messages arrive or during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleNewChat = async () => {
    if (!user) return;

    try {
      // Check if there's already an empty session
      const emptySession = sessions?.find(session => session.message_count === 0);

      if (emptySession) {
        // Just switch to the existing empty session
        setActiveSessionId(emptySession.id);
        return;
      }

      // Create new session only if no empty one exists
      const newSession = await createChatSession(user.id, 'New conversation');
      setActiveSessionId(newSession.id);
    } catch (error) {
      console.error('Error creating chat session:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeSessionId) return;

    // Check if this is the first message (for title generation)
    const isFirstMessage = !messages || messages.length === 0;

    try {
      // Add user message
      await sendMessage.mutateAsync({
        sessionId: activeSessionId,
        content,
        role: 'user',
      });

      // Generate title for first message (async, don't wait)
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

      // Start thinking indicator
      setIsThinking(true);
      setStreamingContent('');

      // Call Barry streaming API
      const response = await fetch('/api/barry/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: content, sessionId: activeSessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

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

      // Save the final message, then clear streaming content
      await sendMessage.mutateAsync({
        sessionId: activeSessionId,
        content: fullResponse,
        role: 'assistant',
      });
      // Small delay to let React Query update before clearing
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

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      // If we deleted the active session, clear the active session
      if (sessionId === activeSessionId) {
        setActiveSessionId(null);
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    try {
      await updateSession.mutateAsync({ sessionId, title: newTitle });
    } catch (error) {
      console.error('Error renaming chat session:', error);
    }
  };

  return (
    <>
      <AnimatedGradientBackground />
      <div className="h-full flex">
        {/* Chat History Sidebar */}
        <ChatHistorySidebar
          sessions={sessions || []}
          activeSessionId={activeSessionId}
          onSessionSelect={setActiveSessionId}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 min-w-0">
          {/* Chat Header */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="font-semibold text-lg text-gray-900 dark:text-white">Barry</div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            {messagesLoading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading messages...</div>
            ) : !activeSessionId ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <p className="text-lg font-semibold mb-2">Welcome to Chat with Barry!</p>
                  <p className="text-sm">Start a new conversation to get started.</p>
                </div>
              </div>
            ) : messages && messages.length === 0 ? (
              <div className="max-w-3xl mx-auto">
                <QuickActionChips onActionClick={handleQuickActionClick} />
              </div>
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
                    <div className="max-w-3xl mx-auto flex gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">Barry</span>
                        </div>
                        <div className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg rounded-tl-none px-4 py-3 border border-gray-100 dark:border-gray-700">
                          <span className="bg-gradient-to-r from-orange-500 from-0% via-amber-200 via-50% to-orange-500 to-100% bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
                            the bees are buzzing...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {streamingContent && (
                  <MessageBubble
                    content={streamingContent}
                    role="assistant"
                  />
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">No messages yet</div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            disabled={!activeSessionId || sendMessage.isPending}
          />
        </div>
      </div>
    </>
  );
}
