import type { HealthStatus } from '../supabase/types';

// Alert types that can be configured
export type AlertType = 'health_drop' | 'bad_interaction';

// User's alert settings for a specific alert type
export interface UserAlertSettings {
  id: string;
  user_id: string;
  alert_type: AlertType;
  email_enabled: boolean;
  slack_enabled: boolean;
  bell_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Details for health drop alerts
export interface HealthDropDetails {
  previousStatus: HealthStatus;
  newStatus: HealthStatus;
  healthScore: number | null;
}

// Details for bad interaction alerts
export interface BadInteractionDetails {
  interactionId: number;
  interactionType: string;
  sentimentScore: number;
  churnRisk: boolean;
  churnReasons: string[] | null;
  summary: string | null;
  interactionDate: string;
}

// Base alert payload
interface BaseAlertPayload {
  accountId: string;
  accountName: string;
  csmUserId: string;
  csmEmail: string;
}

// Health drop alert payload
export interface HealthDropAlertPayload extends BaseAlertPayload {
  type: 'health_drop';
  details: HealthDropDetails;
}

// Bad interaction alert payload
export interface BadInteractionAlertPayload extends BaseAlertPayload {
  type: 'bad_interaction';
  details: BadInteractionDetails;
}

// Union type for all alert payloads
export type AlertPayload = HealthDropAlertPayload | BadInteractionAlertPayload;
