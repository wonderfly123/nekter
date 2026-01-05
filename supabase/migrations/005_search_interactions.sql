-- =====================================================
-- Search Interactions Function
-- Created: 2026-01-04
-- Purpose: Unified search across call transcripts, emails, and zendesk tickets
-- =====================================================

CREATE OR REPLACE FUNCTION search_interactions(
  p_account_name TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_interaction_type TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 90,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  source_type TEXT,
  source_id TEXT,
  account_name TEXT,
  sf_account_id TEXT,
  created_at TIMESTAMPTZ,
  title TEXT,
  content_preview TEXT,
  full_content TEXT,
  participants JSONB,
  sentiment_score NUMERIC,
  churn_risk BOOLEAN,
  expansion_opportunity BOOLEAN
) AS $$
BEGIN
  RETURN QUERY

  -- Call Transcripts
  SELECT
    'transcript'::TEXT as source_type,
    ct.engagement_id::TEXT as source_id,
    a.name as account_name,
    ct.sf_account_id,
    ct.created_at,
    COALESCE(ct.calendar_meeting_name, 'Call Recording')::TEXT as title,
    LEFT(ct.transcript::TEXT, 500)::TEXT as content_preview,
    ct.transcript::TEXT as full_content,
    ct.participants::JSONB as participants,
    ii.sentiment_score::NUMERIC,
    COALESCE(ii.churn_risk, false) as churn_risk,
    COALESCE(ii.expansion_opportunity, false) as expansion_opportunity
  FROM call_transcripts ct
  LEFT JOIN accounts a ON ct.sf_account_id = a.sf_account_id
  LEFT JOIN interaction_insights ii ON ct.engagement_id = ii.source_id AND ii.interaction_type = 'transcript'
  WHERE ct.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_account_name IS NULL OR a.name ILIKE '%' || p_account_name || '%')
    AND (p_search_term IS NULL OR ct.transcript::TEXT ILIKE '%' || p_search_term || '%')
    AND (p_interaction_type IS NULL OR p_interaction_type = 'transcript')

  UNION ALL

  -- Email Threads
  SELECT
    'email'::TEXT as source_type,
    et.engagement_id::TEXT as source_id,
    COALESCE(a.name, et.sf_account_name)::TEXT as account_name,
    et.sf_account_id,
    et.sent_time as created_at,
    COALESCE(et.email_subject, 'Email')::TEXT as title,
    LEFT(et.body, 500)::TEXT as content_preview,
    et.body::TEXT as full_content,
    et.participants::JSONB as participants,
    ii.sentiment_score::NUMERIC,
    COALESCE(ii.churn_risk, false) as churn_risk,
    COALESCE(ii.expansion_opportunity, false) as expansion_opportunity
  FROM email_threads et
  LEFT JOIN accounts a ON et.sf_account_id = a.sf_account_id
  LEFT JOIN interaction_insights ii ON et.engagement_id = ii.source_id AND ii.interaction_type = 'email'
  WHERE et.sent_time >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_account_name IS NULL OR COALESCE(a.name, et.sf_account_name) ILIKE '%' || p_account_name || '%')
    AND (p_search_term IS NULL OR et.body ILIKE '%' || p_search_term || '%')
    AND (p_interaction_type IS NULL OR p_interaction_type = 'email')

  UNION ALL

  -- Zendesk Tickets
  SELECT
    'zendesk'::TEXT as source_type,
    zt.zendesk_ticket_id::TEXT as source_id,
    a.name as account_name,
    zt.sf_account_id,
    zt.created_at,
    COALESCE(zt.subject, 'Support Ticket')::TEXT as title,
    LEFT(zt.description, 500)::TEXT as content_preview,
    zt.description::TEXT as full_content,
    NULL::JSONB as participants,
    ii.sentiment_score::NUMERIC,
    COALESCE(ii.churn_risk, false) as churn_risk,
    COALESCE(ii.expansion_opportunity, false) as expansion_opportunity
  FROM zendesk_tickets zt
  LEFT JOIN accounts a ON zt.sf_account_id = a.sf_account_id
  LEFT JOIN interaction_insights ii ON zt.zendesk_ticket_id::TEXT = ii.source_id AND ii.interaction_type = 'zendesk_comment'
  WHERE zt.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_account_name IS NULL OR a.name ILIKE '%' || p_account_name || '%')
    AND (p_search_term IS NULL OR zt.description ILIKE '%' || p_search_term || '%')
    AND (p_interaction_type IS NULL OR p_interaction_type = 'zendesk')

  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON FUNCTION search_interactions IS 'Unified search across call transcripts, emails, and zendesk tickets with filtering by account, search term, interaction type, and date range';
