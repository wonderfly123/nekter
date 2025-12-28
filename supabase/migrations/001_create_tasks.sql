-- =====================================================
-- Task Management System - Database Schema
-- Created: 2025-12-27
-- =====================================================

-- =====================================================
-- TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core fields
  title TEXT NOT NULL,
  description TEXT,

  -- Status & Priority
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Relationships
  sf_account_id TEXT NOT NULL REFERENCES public.accounts(sf_account_id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Dates
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Additional data
  tags TEXT[] DEFAULT '{}',

  -- Reminder tracking
  reminder_3d_sent BOOLEAN DEFAULT FALSE,
  reminder_1d_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  overdue_reminder_sent BOOLEAN DEFAULT FALSE,
  last_reminder_sent_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_tasks_sf_account_id ON public.tasks(sf_account_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);

-- Composite index for common queries
CREATE INDEX idx_tasks_account_status_due ON public.tasks(sf_account_id, status, due_date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get overdue tasks for reminder emails
CREATE OR REPLACE FUNCTION get_tasks_needing_reminders()
RETURNS TABLE (
  task_id UUID,
  task_title TEXT,
  due_date DATE,
  assignee_email TEXT,
  assignee_name TEXT,
  account_name TEXT,
  reminder_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- 3 days before
  SELECT
    t.id,
    t.title,
    t.due_date,
    u.email,
    COALESCE(u.user_metadata->>'first_name' || ' ' || u.user_metadata->>'last_name', u.email) as assignee_name,
    a.name as account_name,
    '3_days_before' as reminder_type
  FROM public.tasks t
  JOIN auth.users u ON t.assignee_id = u.id
  JOIN public.accounts a ON t.sf_account_id = a.sf_account_id
  WHERE t.status = 'active'
    AND t.due_date = CURRENT_DATE + INTERVAL '3 days'
    AND t.reminder_3d_sent = FALSE

  UNION ALL

  -- 1 day before
  SELECT
    t.id,
    t.title,
    t.due_date,
    u.email,
    COALESCE(u.user_metadata->>'first_name' || ' ' || u.user_metadata->>'last_name', u.email),
    a.name,
    '1_day_before'
  FROM public.tasks t
  JOIN auth.users u ON t.assignee_id = u.id
  JOIN public.accounts a ON t.sf_account_id = a.sf_account_id
  WHERE t.status = 'active'
    AND t.due_date = CURRENT_DATE + INTERVAL '1 day'
    AND t.reminder_1d_sent = FALSE

  UNION ALL

  -- Overdue
  SELECT
    t.id,
    t.title,
    t.due_date,
    u.email,
    COALESCE(u.user_metadata->>'first_name' || ' ' || u.user_metadata->>'last_name', u.email),
    a.name,
    'overdue'
  FROM public.tasks t
  JOIN auth.users u ON t.assignee_id = u.id
  JOIN public.accounts a ON t.sf_account_id = a.sf_account_id
  WHERE t.status = 'active'
    AND t.due_date < CURRENT_DATE
    AND t.overdue_reminder_sent = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark reminder as sent
CREATE OR REPLACE FUNCTION mark_reminder_sent(
  p_task_id UUID,
  p_reminder_type TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.tasks
  SET
    reminder_3d_sent = CASE WHEN p_reminder_type = '3_days_before' THEN TRUE ELSE reminder_3d_sent END,
    reminder_1d_sent = CASE WHEN p_reminder_type = '1_day_before' THEN TRUE ELSE reminder_1d_sent END,
    overdue_reminder_sent = CASE WHEN p_reminder_type = 'overdue' THEN TRUE ELSE overdue_reminder_sent END,
    last_reminder_sent_at = NOW()
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-archive completed tasks older than 90 days
CREATE OR REPLACE FUNCTION auto_archive_old_tasks()
RETURNS void AS $$
BEGIN
  UPDATE public.tasks
  SET status = 'archived',
      archived_at = NOW()
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '90 days'
    AND archived_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Disable RLS for development
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
