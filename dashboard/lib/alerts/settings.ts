import { createClient } from '@supabase/supabase-js';
import type { AlertType, UserAlertSettings } from './types';

// Create Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Default settings when no record exists (all enabled)
const DEFAULT_SETTINGS = {
  email_enabled: true,
  slack_enabled: true,
  bell_enabled: true,
};

/**
 * Get a user's alert settings for a specific alert type
 * Returns default (all enabled) if no settings exist
 */
export async function getUserAlertSettings(
  userId: string,
  alertType: AlertType
): Promise<{ email_enabled: boolean; slack_enabled: boolean; bell_enabled: boolean }> {
  const { data, error } = await supabase
    .from('user_alert_settings')
    .select('email_enabled, slack_enabled, bell_enabled')
    .eq('user_id', userId)
    .eq('alert_type', alertType)
    .single();

  if (error || !data) {
    // No settings found, return defaults (all enabled)
    return DEFAULT_SETTINGS;
  }

  return {
    email_enabled: data.email_enabled,
    slack_enabled: data.slack_enabled,
    bell_enabled: data.bell_enabled,
  };
}

/**
 * Get all alert settings for a user (health_drop, bad_interaction, expansion_opportunity)
 */
export async function getAllUserAlertSettings(
  userId: string
): Promise<Record<AlertType, { email_enabled: boolean; slack_enabled: boolean; bell_enabled: boolean }>> {
  const { data, error } = await supabase
    .from('user_alert_settings')
    .select('alert_type, email_enabled, slack_enabled, bell_enabled')
    .eq('user_id', userId);

  // Start with defaults for all types
  const result: Record<AlertType, { email_enabled: boolean; slack_enabled: boolean; bell_enabled: boolean }> = {
    health_drop: { ...DEFAULT_SETTINGS },
    bad_interaction: { ...DEFAULT_SETTINGS },
    expansion_opportunity: { ...DEFAULT_SETTINGS },
  };

  if (error || !data) {
    return result;
  }

  // Override with actual settings
  for (const row of data) {
    const alertType = row.alert_type as AlertType;
    if (alertType === 'health_drop' || alertType === 'bad_interaction' || alertType === 'expansion_opportunity') {
      result[alertType] = {
        email_enabled: row.email_enabled,
        slack_enabled: row.slack_enabled,
        bell_enabled: row.bell_enabled,
      };
    }
  }

  return result;
}

/**
 * Update a user's alert settings for a specific alert type
 */
export async function updateUserAlertSettings(
  userId: string,
  alertType: AlertType,
  settings: {
    email_enabled?: boolean;
    slack_enabled?: boolean;
    bell_enabled?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_alert_settings')
    .upsert(
      {
        user_id: userId,
        alert_type: alertType,
        email_enabled: settings.email_enabled ?? true,
        slack_enabled: settings.slack_enabled ?? true,
        bell_enabled: settings.bell_enabled ?? true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,alert_type',
      }
    );

  if (error) {
    console.error('Error updating alert settings:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
