'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';
import { AnimatedGradientBackground } from '@/components/portfolio/animated-gradient-bg';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { QuickActionChips } from '@/components/chat/quick-action-chips';
import { useChatSessions } from '@/hooks/use-chat-sessions';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useSendMessage } from '@/hooks/use-send-message';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: messages, isLoading: messagesLoading } = useChatMessages(activeSessionId);
  const sendMessage = useSendMessage();

  // Auto-select first session or create new one
  useEffect(() => {
    if (!sessionsLoading && sessions && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, sessionsLoading, activeSessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = async () => {
    if (!user) return;

    try {
      const newSession = await createChatSession(user.id, 'New conversation');
      setActiveSessionId(newSession.id);

      // Add Barry's welcome message
      await sendMessage.mutateAsync({
        sessionId: newSession.id,
        content:
          "Hey! 👋 I'm Barry, your Smart Nekter Assistant. I can help you with:",
        role: 'assistant',
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeSessionId) return;

    try {
      // Add user message
      await sendMessage.mutateAsync({
        sessionId: activeSessionId,
        content,
        role: 'user',
      });

      // Add placeholder Barry response
      await sendMessage.mutateAsync({
        sessionId: activeSessionId,
        content:
          "I'm analyzing that request for you now...\n\n*(This is a demo - AI integration will be added in the next phase)*",
        role: 'assistant',
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleQuickActionClick = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <>
      <AnimatedGradientBackground />
      <PageContainer className="!p-0 h-[calc(100vh-88px)]">
        <div className="flex h-full">
          {/* Chat History Sidebar */}
          <ChatHistorySidebar
            sessions={sessions || []}
            activeSessionId={activeSessionId}
            onSessionSelect={setActiveSessionId}
            onNewChat={handleNewChat}
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-6 py-6 border-b border-gray-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white text-lg">
                B
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg text-gray-900">Barry</div>
                <div className="text-[13px] text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Your AI CS Assistant
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {messagesLoading ? (
                <div className="text-center text-gray-500 py-8">Loading messages...</div>
              ) : !activeSessionId ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg font-semibold mb-2">Welcome to Chat with Barry!</p>
                  <p className="text-sm">Start a new conversation to get started.</p>
                </div>
              ) : messages && messages.length > 0 ? (
                <>
                  {messages.map((message, index) => (
                    <div key={message.id}>
                      <MessageBubble
                        content={message.content}
                        role={message.role}
                        timestamp={message.created_at}
                      />
                      {/* Show quick action chips after first message (Barry's welcome) */}
                      {index === 0 && message.role === 'assistant' && messages.length === 1 && (
                        <div className="ml-14">
                          <QuickActionChips onActionClick={handleQuickActionClick} />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">No messages yet</div>
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
      </PageContainer>
    </>
  );
}
