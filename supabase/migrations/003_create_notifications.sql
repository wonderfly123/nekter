-- =====================================================
-- Notifications Feature - Database Schema
-- Created: 2025-12-28
-- =====================================================

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core fields
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_reassigned', 'task_completed', 'task_overdue')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Related entity (optional - can link to task, account, etc.)
  related_entity_type TEXT, -- 'task', 'note', 'account', etc.
  related_entity_id TEXT,

  -- Metadata
  is_read BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- Composite index for common query: user's unread notifications ordered by date
CREATE INDEX idx_notifications_user_unread_date ON public.notifications(user_id, is_read, created_at DESC);

-- Disable RLS for development
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
