-- Create approved_users table for access control
CREATE TABLE approved_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  approved_by TEXT,
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX idx_approved_users_email ON approved_users(email);

-- Enable RLS
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "Users can read their own record"
ON approved_users FOR SELECT
USING (auth.email() = email);

-- Admins can read all records
CREATE POLICY "Admins can read all records"
ON approved_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM approved_users
    WHERE email = auth.email() AND role = 'admin'
  )
);

-- Admins can manage all records
CREATE POLICY "Admins can manage approved users"
ON approved_users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM approved_users
    WHERE email = auth.email() AND role = 'admin'
  )
);

-- Enable RLS on all data tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zendesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;

-- Create policies for data tables - only approved users can read
CREATE POLICY "Only approved users can read accounts"
ON accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM approved_users
    WHERE email = auth.email()
  )
);

CREATE POLICY "Only approved users can read account_health_history"
ON account_health_history FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read interaction_insights"
ON interaction_insights FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read opportunities"
ON opportunities FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read contacts"
ON contacts FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read zendesk_tickets"
ON zendesk_tickets FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read call_transcripts"
ON call_transcripts FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));

CREATE POLICY "Only approved users can read email_threads"
ON email_threads FOR SELECT
USING (EXISTS (SELECT 1 FROM approved_users WHERE email = auth.email()));
