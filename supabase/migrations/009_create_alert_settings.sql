-- =====================================================
-- Alert Settings - Database Schema
-- Created: 2026-01-06
-- =====================================================

-- =====================================================
-- USER ALERT SETTINGS TABLE
-- Per-user, per-alert-type notification preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_alert_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Alert type: 'health_drop' or 'bad_interaction'
  alert_type TEXT NOT NULL CHECK (alert_type IN ('health_drop', 'bad_interaction')),

  -- Channel toggles (default all enabled)
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  slack_enabled BOOLEAN NOT NULL DEFAULT true,
  bell_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Each user can only have one row per alert type
  UNIQUE(user_id, alert_type)
);

-- Index for quick lookup by user
CREATE INDEX idx_user_alert_settings_user_id ON public.user_alert_settings(user_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Disable RLS for development (enable in production)
ALTER TABLE public.user_alert_settings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER TRIGGER
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER trigger_user_alert_settings_updated_at
  BEFORE UPDATE ON public.user_alert_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_slack_updated_at();
