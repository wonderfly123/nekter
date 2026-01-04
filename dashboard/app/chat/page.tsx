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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = async () => {
    if (!user) return;

    try {
      // Check if there's already an empty session (only has welcome message)
      const emptySession = sessions?.find(session => session.message_count === 1);

      if (emptySession) {
        // Just switch to the existing empty session
        setActiveSessionId(emptySession.id);
        return;
      }

      // Create new session only if no empty one exists
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
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Chat Header */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="font-semibold text-lg text-gray-900">Barry</div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50">
            {messagesLoading ? (
              <div className="text-center text-gray-500 py-8">Loading messages...</div>
            ) : !activeSessionId ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg font-semibold mb-2">Welcome to Chat with Barry!</p>
                  <p className="text-sm">Start a new conversation to get started.</p>
                </div>
              </div>
            ) : messages && messages.length === 1 && messages[0].role === 'assistant' ? (
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
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 py-8">No messages yet</div>
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
