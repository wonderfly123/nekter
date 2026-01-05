-- =====================================================
-- Update Search Interactions Function with Health Status Filter
-- Created: 2026-01-04
-- Purpose: Add filtering by account health status (Critical, At Risk, Healthy)
-- =====================================================

-- Drop the old function signature first (7 parameters)
DROP FUNCTION IF EXISTS search_interactions(TEXT, TEXT, TEXT, INTEGER, INTEGER, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION search_interactions(
  p_account_name TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_interaction_type TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 90,
  p_limit INTEGER DEFAULT 20,
  p_churn_risk BOOLEAN DEFAULT NULL,
  p_expansion_opportunity BOOLEAN DEFAULT NULL,
  p_health_status TEXT DEFAULT NULL
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
  expansion_opportunity BOOLEAN,
  health_status TEXT
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
    COALESCE(ii.expansion_opportunity, false) as expansion_opportunity,
    ah.acct_health::TEXT as health_status
  FROM call_transcripts ct
  LEFT JOIN accounts a ON ct.sf_account_id = a.sf_account_id
  LEFT JOIN interaction_insights ii ON ct.engagement_id = ii.source_id AND ii.interaction_type = 'transcript'
  LEFT JOIN LATERAL (
    SELECT ahh.health_status as acct_health FROM account_health_history ahh
    WHERE ahh.sf_account_id = ct.sf_account_id
    ORDER BY ahh.created_at DESC LIMIT 1
  ) ah ON true
  WHERE ct.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_account_name IS NULL OR a.name ILIKE '%' || p_account_name || '%')
    AND (p_search_term IS NULL OR ct.transcript::TEXT ILIKE '%' || p_search_term || '%')
    AND (p_interaction_type IS NULL OR p_interaction_type = 'transcript')
    AND (p_churn_risk IS NULL OR ii.churn_risk = p_churn_risk)
    AND (p_expansion_opportunity IS NULL OR ii.expansion_opportunity = p_expansion_opportunity)
    AND (p_health_status IS NULL OR ah.acct_health = p_health_status)

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
    COALESCE(ii.expansion_opportunity, false) as expansion_opportunity,
    ah.acct_health::TEXT as health_status
  FROM email_threads et
  LEFT JOIN accounts a ON et.sf_account_id = a.sf_account_id
  LEFT JOIN interaction_insights ii ON et.engagement_id = ii.source_id AND ii.interaction_type = 'email'
  LEFT JOIN LATERAL (
    SELECT ahh.health_status as acct_health FROM account_health_history ahh
    WHERE ahh.sf_account_id = et.sf_account_id
    ORDER BY ahh.created_at DESC LIMIT 1
  ) ah ON true
  WHERE et.sent_time >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_account_name IS NULL OR COALESCE(a.name, et.sf_account_name) ILIKE '%' || p_account_name || '%')
    AND (p_search_term IS NULL OR et.body ILIKE '%' || p_search_term || '%')
    AND (p_interaction_type IS NULL OR p_interaction_type = 'email')
    AND (p_churn_risk IS NULL OR ii.churn_risk = p_churn_risk)
    AND (p_expansion_opportunity IS NULL OR ii.expansion_opportunity = p_expansion_opportunity)
    AND (p_health_status IS NULL OR ah.acct_health = p_health_status)

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
    COALESCE(ii.expansion_opportunity, false) as expansion_opportunity,
    ah.acct_health::TEXT as health_status
  FROM zendesk_tickets zt
  LEFT JOIN accounts a ON zt.sf_account_id = a.sf_account_id
  LEFT JOIN interaction_insights ii ON zt.zendesk_ticket_id::TEXT = ii.source_id AND ii.interaction_type = 'zendesk_comment'
  LEFT JOIN LATERAL (
    SELECT ahh.health_status as acct_health FROM account_health_history ahh
    WHERE ahh.sf_account_id = zt.sf_account_id
    ORDER BY ahh.created_at DESC LIMIT 1
  ) ah ON true
  WHERE zt.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_account_name IS NULL OR a.name ILIKE '%' || p_account_name || '%')
    AND (p_search_term IS NULL OR zt.description ILIKE '%' || p_search_term || '%')
    AND (p_interaction_type IS NULL OR p_interaction_type = 'zendesk')
    AND (p_churn_risk IS NULL OR ii.churn_risk = p_churn_risk)
    AND (p_expansion_opportunity IS NULL OR ii.expansion_opportunity = p_expansion_opportunity)
    AND (p_health_status IS NULL OR ah.acct_health = p_health_status)

  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_interactions IS 'Unified search across call transcripts, emails, and zendesk tickets with filtering by account, search term, interaction type, date range, churn risk, expansion opportunity, and health status';
