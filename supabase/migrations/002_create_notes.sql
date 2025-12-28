-- =====================================================
-- Notes Feature - Database Schema
-- Created: 2025-12-28
-- =====================================================

-- =====================================================
-- NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core fields
  title TEXT NOT NULL,
  content TEXT,

  -- Relationships
  sf_account_id TEXT NOT NULL REFERENCES public.accounts(sf_account_id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Metadata
  is_pinned BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_notes_sf_account_id ON public.notes(sf_account_id);
CREATE INDEX idx_notes_created_by ON public.notes(created_by);
CREATE INDEX idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX idx_notes_is_pinned ON public.notes(is_pinned);

-- Composite index for common query: pinned notes first, then by date
CREATE INDEX idx_notes_account_pinned_date ON public.notes(sf_account_id, is_pinned DESC, created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

-- Disable RLS for development
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
