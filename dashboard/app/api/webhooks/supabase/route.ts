import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendAlert } from '@/lib/alerts';
import type { HealthStatus } from '@/lib/supabase/types';
import type { HealthDropAlertPayload, BadInteractionAlertPayload, ExpansionOpportunityAlertPayload } from '@/lib/alerts/types';

// Create Supabase client with service role
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

// Webhook secret for authentication
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET;

/**
 * Verify the webhook request is legitimate
 */
function verifyWebhookAuth(request: Request): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('SUPABASE_WEBHOOK_SECRET not configured - webhook authentication disabled');
    return true; // Allow in development
  }

  const authHeader = request.headers.get('x-webhook-secret');
  return authHeader === WEBHOOK_SECRET;
}

/**
 * Look up account and CSM info
 */
async function getAccountWithCSM(sfAccountId: string): Promise<{
  accountName: string;
  csmUserId: string;
  csmEmail: string;
} | null> {
  const { data: account, error } = await supabase
    .from('accounts')
    .select('name, csm_id, csm_email')
    .eq('sf_account_id', sfAccountId)
    .single();

  if (error || !account || !account.csm_id || !account.csm_email) {
    console.error('Account lookup failed or missing CSM:', { sfAccountId, error });
    return null;
  }

  return {
    accountName: account.name,
    csmUserId: account.csm_id,
    csmEmail: account.csm_email,
  };
}

/**
 * Get previous health status for an account (before the new record)
 */
async function getPreviousHealthStatus(sfAccountId: string, newRecordId: number): Promise<HealthStatus | null> {
  const { data, error } = await supabase
    .from('account_health_history')
    .select('health_status')
    .eq('sf_account_id', sfAccountId)
    .neq('id', newRecordId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.health_status as HealthStatus;
}

/**
 * Check if health status change is a downgrade
 */
function isHealthDowngrade(previousStatus: HealthStatus, newStatus: HealthStatus): boolean {
  const healthOrder: Record<HealthStatus, number> = {
    'Healthy': 3,
    'At Risk': 2,
    'Critical': 1,
  };

  return healthOrder[newStatus] < healthOrder[previousStatus];
}

// Supabase webhook payload format
interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, any>;
  old_record: Record<string, any> | null;
}

/**
 * POST /api/webhooks/supabase
 *
 * Handles Supabase Database Webhooks for:
 * - account_health_history INSERT events
 * - interaction_insights INSERT events
 */
export async function POST(request: Request) {
  try {
    // Verify webhook authentication
    if (!verifyWebhookAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: SupabaseWebhookPayload = await request.json();

    // Only handle INSERT events
    if (payload.type !== 'INSERT') {
      return NextResponse.json({ message: 'Ignored non-INSERT event' });
    }

    const { table, record } = payload;

    // Handle account_health_history inserts
    if (table === 'account_health_history') {
      const sfAccountId = record.sf_account_id;
      const newStatus = record.health_status as HealthStatus;
      const healthScore = record.health_score;
      const recordId = record.id;

      // Look up account and CSM
      const accountInfo = await getAccountWithCSM(sfAccountId);
      if (!accountInfo) {
        console.log('Skipping alert - no CSM assigned:', sfAccountId);
        return NextResponse.json({ message: 'No CSM assigned' });
      }

      // Get previous health status
      const previousStatus = await getPreviousHealthStatus(sfAccountId, recordId);

      if (previousStatus && isHealthDowngrade(previousStatus, newStatus)) {
        const alertPayload: HealthDropAlertPayload = {
          type: 'health_drop',
          accountId: sfAccountId,
          accountName: accountInfo.accountName,
          csmUserId: accountInfo.csmUserId,
          csmEmail: accountInfo.csmEmail,
          details: {
            previousStatus,
            newStatus,
            healthScore,
          },
        };

        const result = await sendAlert(alertPayload);
        console.log('Health drop alert sent:', {
          account: sfAccountId,
          change: `${previousStatus} → ${newStatus}`,
          channels: result,
        });

        return NextResponse.json({ success: true, alertSent: true, channels: result });
      }

      return NextResponse.json({ message: 'Not a health downgrade' });
    }

    // Handle interaction_insights inserts
    if (table === 'interaction_insights') {
      const sfAccountId = record.sf_account_id;
      const sentimentScore = record.sentiment_score;
      const churnRisk = record.churn_risk;
      const churnReasons = record.churn_reasons;
      const expansionOpportunity = record.expansion_opportunity;
      const expansionReasons = record.expansion_reasons;
      const summary = record.insight_summary;
      const interactionType = record.interaction_type;
      const interactionId = record.id;
      const createdAt = record.created_at;

      // Check what alerts to send
      const isBad = churnRisk || sentimentScore < 60;
      const isExpansion = expansionOpportunity === true;

      if (!isBad && !isExpansion) {
        return NextResponse.json({ message: 'Interaction does not qualify for alert' });
      }

      // Look up account and CSM
      const accountInfo = await getAccountWithCSM(sfAccountId);
      if (!accountInfo) {
        console.log('Skipping alert - no CSM assigned:', sfAccountId);
        return NextResponse.json({ message: 'No CSM assigned' });
      }

      const interactionDate = new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const results: { badInteraction?: any; expansion?: any } = {};

      // Send bad interaction alert if applicable
      if (isBad) {
        const badAlertPayload: BadInteractionAlertPayload = {
          type: 'bad_interaction',
          accountId: sfAccountId,
          accountName: accountInfo.accountName,
          csmUserId: accountInfo.csmUserId,
          csmEmail: accountInfo.csmEmail,
          details: {
            interactionId,
            interactionType,
            sentimentScore,
            churnRisk,
            churnReasons,
            summary,
            interactionDate,
          },
        };

        results.badInteraction = await sendAlert(badAlertPayload);
        console.log('Bad interaction alert sent:', {
          account: sfAccountId,
          interactionId,
          churnRisk,
          sentiment: sentimentScore,
          channels: results.badInteraction,
        });
      }

      // Send expansion opportunity alert if applicable
      if (isExpansion) {
        const expansionAlertPayload: ExpansionOpportunityAlertPayload = {
          type: 'expansion_opportunity',
          accountId: sfAccountId,
          accountName: accountInfo.accountName,
          csmUserId: accountInfo.csmUserId,
          csmEmail: accountInfo.csmEmail,
          details: {
            interactionId,
            interactionType,
            sentimentScore,
            expansionReasons,
            summary,
            interactionDate,
          },
        };

        results.expansion = await sendAlert(expansionAlertPayload);
        console.log('Expansion opportunity alert sent:', {
          account: sfAccountId,
          interactionId,
          expansionReasons,
          channels: results.expansion,
        });
      }

      return NextResponse.json({ success: true, alertSent: true, results });
    }

    return NextResponse.json({ message: `Unhandled table: ${table}` });
  } catch (error: any) {
    console.error('Error processing Supabase webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
