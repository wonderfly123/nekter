// Database Table Types
export interface Account {
  id: number;
  sf_account_id: string;
  name: string;
  type: string | null;
  arr: number | null;
  industry: string | null;
  employee_count: number | null;
  owner_email: string | null;
  owner_id: string | null;
  owner_name: string | null;
  csm_email: string | null;
  csm_id: string | null;
  csm_name: string | null;
  last_activity_date: string | null;
  days_since_activity: number | null;
  created_at: string | null;
  updated_at: string | null;
  last_synced_at: string | null;
}

export interface AccountHealth {
  id: number;
  sf_account_id: string;
  health_status: HealthStatus;
  trend: TrendStatus;
  avg_sentiment: number | null;
  interaction_count: number | null;
  churn_signals: number | null;
  expansion_signals: number | null;
  open_ticket_count: number | null;
  days_since_activity: number | null;
  created_at: string | null;
}

export interface InteractionInsight {
  id: number;
  sf_account_id: string;
  interaction_type: string;
  source_id: string | null;
  sentiment_score: number;
  sentiment_reasons: string[] | null;
  engagement_quality_score: number;
  engagement_reasons: string[] | null;
  churn_risk: boolean;
  churn_reasons: string[] | null;
  expansion_opportunity: boolean;
  expansion_reasons: string[] | null;
  insight_summary: string | null;
  created_at: string | null;
}

export interface Opportunity {
  id: number;
  sf_opp_id: string;
  sf_account_id: string;
  name: string;
  stage: string | null;
  amount: number | null;
  close_date: string | null;
  is_closed: boolean | null;
  is_won: boolean | null;
  type: string | null;
  lost_reason: string | null;
  lost_reason_detail: string | null;
  last_activity_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_synced_at: string | null;
}

export interface Contact {
  id: number;
  sf_contact_id: string;
  sf_account_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  mobile_phone: string | null;
  title: string | null;
  department: string | null;
  customer_role: string | null;
  management_level: string | null;
  last_activity_date: string | null;
  last_org_login_date: string | null;
  is_active_user: boolean | null;
  left_company: boolean | null;
  email_valid: boolean | null;
  has_opted_out: boolean | null;
  lifecycle_stage: string | null;
  linkedin_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_synced_at: string | null;
}

export interface ZendeskTicket {
  id: number;
  zendesk_ticket_id: number;
  zendesk_org_id: number | null;
  sf_account_id: string | null;
  subject: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  ticket_type: string | null;
  requester_id: number | null;
  assignee_id: number | null;
  tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  last_synced_at: string | null;
}

export interface CallTranscript {
  id: number;
  sf_account_id: string | null;
  engagement_id: string;
  sf_opp_id: string | null;
  sf_opp_name: string | null;
  call_owner: string | null;
  engagement_type: string | null;
  vector_filepath: string | null;
  transcript: any;
  participants: any;
  chorus_link: string | null;
  account: any;
  metrics: any;
  calendar_meeting_name: string | null;
  duration: number | null;
  created_at: string | null;
  last_synced_at: string | null;
}

export interface EmailThread {
  id: number;
  engagement_id: string;
  thread: string | null;
  sf_account_id: string | null;
  sf_account_name: string | null;
  sf_opp_id: string | null;
  sf_opp_name: string | null;
  email_subject: string | null;
  body: string | null;
  sent_time: string | null;
  initiator_email: string | null;
  initiator_name: string | null;
  participants: any;
  created_at: string | null;
  modified_at: string | null;
  last_synced_at: string | null;
}

// Helper Types
export type HealthStatus = 'Healthy' | 'At Risk' | 'Critical';
export type TrendStatus = 'Improving' | 'Declining' | 'Stable' | null;

// Composite Types (for UI)
export interface PriorityAccount {
  // From accounts table
  sf_account_id: string;
  name: string;
  arr: number | null;
  csm_name: string | null;

  // From account_health_history
  health: AccountHealth;

  // Calculated from interaction_insights
  topSignals: string[];

  // Priority score for sorting
  priorityScore: number;
}

export interface PortfolioStats {
  criticalCount: number;
  criticalARR: number;
  atRiskCount: number;
  atRiskARR: number;
  renewalsCount: number;
  renewalsARR: number;
  healthyCount: number;
  healthyARR: number;
}

export interface AccountDetailData {
  // From accounts
  account: Account;

  // From account_health_history
  currentHealth: AccountHealth;
  healthHistory: AccountHealth[];

  // From interaction_insights
  recentInteractions: InteractionInsight[];

  // Calculated
  openTicketCount: number;
  contactCount: number;
  championLeft: boolean;
}
