# Chat with Barry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an AI chat assistant interface ("Barry") to the nekter.io dashboard with chat history persistence in Supabase.

**Architecture:** Create a new `/chat` route with a three-column layout: chat history sidebar (left), main chat interface (center), and quick actions sidebar (right). Use existing dashboard styling patterns (Tailwind CSS with amber/orange theme). Store chat sessions and messages in Supabase with user authentication integration. Use placeholder welcome message for Barry (no AI integration yet).

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase, React Query, Lucide icons

---

## Task 1: Database Schema - Chat Tables

**Files:**
- Create: `supabase/migrations/004_create_chat_tables.sql`

**Step 1: Write migration for chat_sessions and chat_messages tables**

```sql
-- =====================================================
-- Chat with Barry - Database Schema
-- Created: 2026-01-04
-- =====================================================

-- =====================================================
-- CHAT SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core fields
  title TEXT NOT NULL,

  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_last_message_at ON public.chat_sessions(last_message_at DESC);
CREATE INDEX idx_chat_sessions_user_last_message ON public.chat_sessions(user_id, last_message_at DESC);

-- =====================================================
-- CHAT MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core fields
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),

  -- Relationships
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_chat_messages_session_created ON public.chat_messages(session_id, created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at trigger for chat_sessions
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_sessions_updated_at();

-- Update last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_session_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_messages_update_session
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_message_at();

-- Disable RLS for development
ALTER TABLE public.chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
```

**Step 2: Apply migration**

Run: `cd supabase && supabase migration up`

Expected: Migration applied successfully

**Step 3: Commit database schema**

```bash
git add supabase/migrations/004_create_chat_tables.sql
git commit -m "feat: add database schema for chat sessions and messages

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: TypeScript Types - Chat Models

**Files:**
- Modify: `dashboard/lib/supabase/types.ts`

**Step 1: Add ChatSession and ChatMessage types**

Add to `dashboard/lib/supabase/types.ts` after existing types:

```typescript
// Chat types
export interface ChatSession {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  session_id: string;
  created_at: string;
}

export interface ChatSessionWithPreview extends ChatSession {
  preview: string;
  message_count: number;
}
```

**Step 2: Commit types**

```bash
git add dashboard/lib/supabase/types.ts
git commit -m "feat: add TypeScript types for chat sessions and messages

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Supabase Queries - Chat Operations

**Files:**
- Modify: `dashboard/lib/supabase/queries.ts`

**Step 1: Add chat query functions**

Add to the end of `dashboard/lib/supabase/queries.ts`:

```typescript
// =====================================================
// CHAT QUERIES
// =====================================================

export async function getChatSessions(userId: string): Promise<ChatSessionWithPreview[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`
      *,
      chat_messages (
        content,
        role,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false });

  if (error) throw error;

  // Transform data to include preview and count
  return (data || []).map((session: any) => {
    const messages = session.chat_messages || [];
    const lastUserMessage = messages.find((m: any) => m.role === 'user');

    return {
      id: session.id,
      title: session.title,
      user_id: session.user_id,
      created_at: session.created_at,
      updated_at: session.updated_at,
      last_message_at: session.last_message_at,
      preview: lastUserMessage?.content || 'No messages yet',
      message_count: messages.length,
    };
  });
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createChatSession(userId: string, title: string): Promise<ChatSession> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addChatMessage(
  sessionId: string,
  content: string,
  role: 'user' | 'assistant'
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      content,
      role,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}
```

**Step 2: Commit queries**

```bash
git add dashboard/lib/supabase/queries.ts
git commit -m "feat: add Supabase queries for chat operations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: React Hooks - Chat Data Fetching

**Files:**
- Create: `dashboard/hooks/use-chat-sessions.ts`
- Create: `dashboard/hooks/use-chat-messages.ts`
- Create: `dashboard/hooks/use-send-message.ts`

**Step 1: Create use-chat-sessions hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import { getChatSessions } from '@/lib/supabase/queries';
import { useAuth } from '@/lib/auth/use-auth';

export function useChatSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chat-sessions', user?.id],
    queryFn: () => getChatSessions(user!.id),
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
```

**Step 2: Create use-chat-messages hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import { getChatMessages } from '@/lib/supabase/queries';

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => getChatMessages(sessionId!),
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

**Step 3: Create use-send-message hook**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addChatMessage } from '@/lib/supabase/queries';

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      content,
      role,
    }: {
      sessionId: string;
      content: string;
      role: 'user' | 'assistant';
    }) => addChatMessage(sessionId, content, role),
    onSuccess: (_, variables) => {
      // Invalidate messages for this session
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', variables.sessionId],
      });
      // Invalidate sessions list to update last_message_at
      queryClient.invalidateQueries({
        queryKey: ['chat-sessions'],
      });
    },
  });
}
```

**Step 4: Commit hooks**

```bash
git add dashboard/hooks/use-chat-sessions.ts dashboard/hooks/use-chat-messages.ts dashboard/hooks/use-send-message.ts
git commit -m "feat: add React Query hooks for chat data fetching

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Chat Components - Message Bubble

**Files:**
- Create: `dashboard/components/chat/message-bubble.tsx`

**Step 1: Create MessageBubble component**

```typescript
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
```

**Step 2: Commit MessageBubble**

```bash
git add dashboard/components/chat/message-bubble.tsx
git commit -m "feat: add MessageBubble component for chat interface

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Chat Components - Chat History Item

**Files:**
- Create: `dashboard/components/chat/chat-history-item.tsx`

**Step 1: Create ChatHistoryItem component**

```typescript
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
```

**Step 2: Commit ChatHistoryItem**

```bash
git add dashboard/components/chat/chat-history-item.tsx
git commit -m "feat: add ChatHistoryItem component

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Chat Components - Chat History Sidebar

**Files:**
- Create: `dashboard/components/chat/chat-history-sidebar.tsx`

**Step 1: Create ChatHistorySidebar component**

```typescript
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
          className="w-full px-4 py-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg font-semibold text-[15px] flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-[18px] h-[18px]" />
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
```

**Step 2: Commit ChatHistorySidebar**

```bash
git add dashboard/components/chat/chat-history-sidebar.tsx
git commit -m "feat: add ChatHistorySidebar component with time-based grouping

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Chat Components - Quick Actions Sidebar

**Files:**
- Create: `dashboard/components/chat/quick-actions-sidebar.tsx`

**Step 1: Create QuickActionsSidebar component**

```typescript
'use client';

import { FileText, Info, TrendingUp, Mail } from 'lucide-react';

interface QuickActionsidebarProps {
  onQuickPrompt: (prompt: string) => void;
}

interface QuickAction {
  icon: typeof FileText;
  title: string;
  description: string;
  prompt: string;
}

const quickActions: QuickAction[] = [
  {
    icon: FileText,
    title: 'Create Account Plan',
    description: 'Generate a strategic account plan with goals, stakeholders, and success metrics',
    prompt:
      'Create a comprehensive account plan for [Account Name] including success criteria, key stakeholders, and quarterly objectives',
  },
  {
    icon: Info,
    title: 'Deep Interaction Analysis',
    description: 'Surface patterns, sentiment shifts, and hidden signals from all touchpoints',
    prompt:
      'Analyze all interactions with my critical accounts over the last 30 days. Identify sentiment trends, key concerns, and action items.',
  },
  {
    icon: TrendingUp,
    title: 'Expansion Analysis',
    description: 'Find upsell and cross-sell opportunities based on usage patterns',
    prompt:
      'Identify expansion opportunities in my portfolio based on product usage, engagement levels, and comparable accounts',
  },
  {
    icon: Mail,
    title: 'Draft Email',
    description: 'Generate personalized emails with account context and sentiment awareness',
    prompt:
      'Draft a follow-up email to [Account Name] addressing their recent concerns and proposing next steps',
  },
];

export function QuickActionsSidebar({ onQuickPrompt }: QuickActionsidebarProps) {
  return (
    <div className="w-[320px] bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-4">
          Quick Actions
        </div>

        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => onQuickPrompt(action.prompt)}
              className="w-full text-left p-3.5 bg-gray-50 border border-gray-200 rounded-lg mb-3 hover:border-amber-500 hover:bg-amber-50 transition-all hover:translate-x-0.5 group"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-amber-600" />
                </div>
                <div className="font-semibold text-[15px] text-gray-900">
                  {action.title}
                </div>
              </div>
              <div className="text-[13px] text-gray-600 leading-relaxed pl-11">
                {action.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit QuickActionsSidebar**

```bash
git add dashboard/components/chat/quick-actions-sidebar.tsx
git commit -m "feat: add QuickActionsSidebar component

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Chat Components - Chat Input

**Files:**
- Create: `dashboard/components/chat/chat-input.tsx`

**Step 1: Create ChatInput component**

```typescript
'use client';

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask Barry anything about your accounts, health scores, expansion opportunities...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full min-h-[60px] max-h-[120px] px-3.5 py-3 border border-gray-300 rounded-lg font-sans text-[15px] resize-y focus:outline-none focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="px-6 py-3.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg font-semibold text-[15px] flex items-center gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <span>Send</span>
          <Send className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit ChatInput**

```bash
git add dashboard/components/chat/chat-input.tsx
git commit -m "feat: add ChatInput component with keyboard support

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Chat Page - Main Chat Interface

**Files:**
- Create: `dashboard/app/chat/page.tsx`

**Step 1: Create chat page with full interface**

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';
import { AnimatedGradientBackground } from '@/components/portfolio/animated-gradient-bg';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { QuickActionsSidebar } from '@/components/chat/quick-actions-sidebar';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
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
          "Hey! 👋 I'm Barry, your AI customer success assistant. I can help you with account planning, deep interaction analysis, expansion opportunities, and much more.\n\nI have access to your full portfolio and can pull insights from all your customer interactions. What would you like to work on today?",
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

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
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
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      content={message.content}
                      role={message.role}
                      timestamp={message.created_at}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">No messages yet</div>
              )}
            </div>

            {/* Chat Input */}
            <ChatInput
              onSend={handleSendMessage}
              disabled={!activeSessionId || sendMessage.isPending}
            />
          </div>

          {/* Quick Actions Sidebar */}
          <QuickActionsSidebar onQuickPrompt={handleQuickPrompt} />
        </div>
      </PageContainer>
    </>
  );
}
```

**Step 2: Commit chat page**

```bash
git add dashboard/app/chat/page.tsx
git commit -m "feat: add chat page with full interface and state management

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Navigation - Add Chat to Sidebar

**Files:**
- Modify: `dashboard/components/layout/sidebar.tsx:18-23`

**Step 1: Add chat nav item to sidebar**

Find the `navItems` array around line 18-23 and add the chat item:

```typescript
const navItems: NavItem[] = [
  { name: 'Portfolio', href: '/portfolio', icon: LayoutDashboard },
  { name: 'Priority', href: '/priority', icon: Zap },
  { name: 'All Accounts', href: '/all-accounts', icon: Users },
  { name: 'Chat with Barry', href: '/chat', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];
```

**Step 2: Add MessageSquare import**

At the top of the file around line 6, add MessageSquare to the imports:

```typescript
import { LayoutDashboard, Zap, Users, BarChart3, MessageSquare, LucideIcon, Droplet } from 'lucide-react';
```

**Step 3: Commit sidebar update**

```bash
git add dashboard/components/layout/sidebar.tsx
git commit -m "feat: add Chat with Barry to sidebar navigation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Testing - Manual Verification

**Step 1: Start dev server**

Run: `cd dashboard && npm run dev`

Expected: Server starts on http://localhost:3000

**Step 2: Navigate to chat page**

1. Open browser to http://localhost:3000/chat
2. Click "New Chat" button
3. Verify Barry's welcome message appears
4. Type a test message and send
5. Verify user message appears
6. Verify Barry's placeholder response appears

Expected: All interactions work smoothly

**Step 3: Test chat history**

1. Create 2-3 new chats
2. Verify they appear in left sidebar
3. Click between different chats
4. Verify messages load correctly for each chat
5. Verify "Today" grouping works

Expected: Chat history persists and switches correctly

**Step 4: Test quick actions**

1. Click each quick action button
2. Verify prompt populates in input
3. Send the message
4. Verify it's added to chat

Expected: Quick actions work as expected

**Step 5: Test responsive layout**

1. Resize browser window
2. Verify three-column layout maintains structure
3. Check on mobile viewport (if applicable)

Expected: Layout remains functional

---

## Task 13: Final Testing and Documentation

**Step 1: Verify database**

Check Supabase dashboard:
1. Verify `chat_sessions` table exists with correct schema
2. Verify `chat_messages` table exists with correct schema
3. Check that test data was created
4. Verify triggers are working (last_message_at updates)

Expected: All database features working correctly

**Step 2: Code review checklist**

- [ ] All TypeScript types are properly defined
- [ ] No console errors in browser
- [ ] All components use existing styling patterns
- [ ] Proper error handling in async operations
- [ ] React Query invalidation works correctly
- [ ] Messages auto-scroll to bottom
- [ ] Timestamps display correctly

**Step 3: Create final commit**

```bash
git add .
git commit -m "feat: complete Chat with Barry implementation

- Database schema with sessions and messages tables
- React Query hooks for data fetching
- Chat UI components with three-column layout
- Navigation integration
- Placeholder AI responses for demo

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 4: Push to remote**

Run: `git push origin main`

Expected: All changes pushed successfully

---

## Future Enhancements (Not in This Plan)

The following features should be implemented in separate tasks:

1. **AI Integration**: Replace placeholder Barry responses with actual AI/LLM integration
2. **Context Awareness**: Pull account data and interaction history into chat context
3. **Action Buttons**: Add action buttons to Barry's responses (e.g., "Create Task", "Send Email")
4. **Search**: Add search functionality to chat history
5. **Export**: Allow exporting chat conversations
6. **Editing**: Allow editing/deleting messages
7. **Rich Formatting**: Add markdown/rich text support in messages
8. **File Attachments**: Support uploading files/screenshots
9. **Voice Input**: Add speech-to-text for message input
10. **Notifications**: Real-time notifications when Barry responds

---

## Notes

- Uses placeholder Barry responses - no AI integration yet
- RLS is disabled for development - enable in production
- Chat history is persisted in Supabase
- Styling matches existing nekter.io dashboard theme (amber/orange)
- Uses existing component patterns (PageContainer, AnimatedGradientBackground)
- All data fetching uses React Query for caching and optimistic updates