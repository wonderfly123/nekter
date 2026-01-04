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
