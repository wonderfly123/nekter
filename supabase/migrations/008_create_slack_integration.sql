-- =====================================================
-- Slack Integration - Database Schema
-- Created: 2026-01-05
-- =====================================================

-- =====================================================
-- SLACK INSTALLATIONS TABLE
-- Stores bot tokens per Slack workspace
-- For now, single workspace; can add org_id later for multi-tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS public.slack_installations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Slack workspace info
  slack_team_id TEXT NOT NULL UNIQUE,
  slack_team_name TEXT,

  -- Bot credentials (store encrypted in production)
  bot_token TEXT NOT NULL,
  bot_user_id TEXT,

  -- Who installed
  installed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  installed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for quick lookup by team
CREATE INDEX idx_slack_installations_team_id ON public.slack_installations(slack_team_id);

-- =====================================================
-- USER SLACK SETTINGS TABLE
-- Per-user Slack notification preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_slack_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preferences
  slack_notifications_enabled BOOLEAN DEFAULT FALSE,

  -- Cached Slack user ID (looked up by email)
  slack_user_id TEXT,

  -- Which workspace they're connected to
  slack_team_id TEXT REFERENCES public.slack_installations(slack_team_id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Disable RLS for development (enable in production)
ALTER TABLE public.slack_installations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_slack_settings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_slack_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for slack_installations
CREATE TRIGGER trigger_slack_installations_updated_at
  BEFORE UPDATE ON public.slack_installations
  FOR EACH ROW
  EXECUTE FUNCTION update_slack_updated_at();

-- Trigger for user_slack_settings
CREATE TRIGGER trigger_user_slack_settings_updated_at
  BEFORE UPDATE ON public.user_slack_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_slack_updated_at();
