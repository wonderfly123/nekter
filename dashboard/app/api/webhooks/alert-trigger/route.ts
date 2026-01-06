import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendAlert } from '@/lib/alerts';
import type { HealthStatus } from '@/lib/supabase/types';
import type { HealthDropAlertPayload, BadInteractionAlertPayload } from '@/lib/alerts/types';

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
const WEBHOOK_SECRET = process.env.ALERT_WEBHOOK_SECRET;

/**
 * Verify the webhook request is legitimate
 */
function verifyWebhookAuth(request: Request): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('ALERT_WEBHOOK_SECRET not configured - webhook authentication disabled');
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
 * Get previous health status for an account
 */
async function getPreviousHealthStatus(sfAccountId: string, excludeId?: number): Promise<HealthStatus | null> {
  let query = supabase
    .from('account_health_history')
    .select('health_status')
    .eq('sf_account_id', sfAccountId)
    .order('created_at', { ascending: false })
    .limit(2); // Get latest 2 to find the previous

  const { data, error } = await query;

  if (error || !data || data.length < 2) {
    return null;
  }

  // If we have an excludeId (the newly inserted record), skip it
  // Otherwise just return the second most recent
  return data[1].health_status as HealthStatus;
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

interface HealthDropWebhookPayload {
  type: 'health_drop';
  sf_account_id: string;
  health_status: HealthStatus;
  health_score: number | null;
  record_id?: number;
}

interface BadInteractionWebhookPayload {
  type: 'bad_interaction';
  sf_account_id: string;
  interaction_id: number;
  interaction_type: string;
  sentiment_score: number;
  churn_risk: boolean;
  churn_reasons: string[] | null;
  insight_summary: string | null;
  created_at: string;
}

type WebhookPayload = HealthDropWebhookPayload | BadInteractionWebhookPayload;

/**
 * POST /api/webhooks/alert-trigger
 *
 * Webhook endpoint called by external data sync services when:
 * 1. A new account_health_history record is inserted (health status change)
 * 2. A new interaction_insights record is inserted with concerning signals
 *
 * Request body:
 * - type: 'health_drop' | 'bad_interaction'
 * - For health_drop: sf_account_id, health_status, health_score
 * - For bad_interaction: sf_account_id, interaction_id, interaction_type, sentiment_score, churn_risk, churn_reasons, insight_summary, created_at
 */
export async function POST(request: Request) {
  try {
    // Verify webhook authentication
    if (!verifyWebhookAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: WebhookPayload = await request.json();

    // Validate required fields
    if (!payload.type || !payload.sf_account_id) {
      return NextResponse.json(
        { error: 'Missing required fields: type, sf_account_id' },
        { status: 400 }
      );
    }

    // Look up account and CSM
    const accountInfo = await getAccountWithCSM(payload.sf_account_id);
    if (!accountInfo) {
      return NextResponse.json(
        { error: 'Account not found or missing CSM assignment' },
        { status: 404 }
      );
    }

    let alertSent = false;

    if (payload.type === 'health_drop') {
      // Get previous health status to check for downgrade
      const previousStatus = await getPreviousHealthStatus(payload.sf_account_id, payload.record_id);

      if (previousStatus && isHealthDowngrade(previousStatus, payload.health_status)) {
        const alertPayload: HealthDropAlertPayload = {
          type: 'health_drop',
          accountId: payload.sf_account_id,
          accountName: accountInfo.accountName,
          csmUserId: accountInfo.csmUserId,
          csmEmail: accountInfo.csmEmail,
          details: {
            previousStatus,
            newStatus: payload.health_status,
            healthScore: payload.health_score,
          },
        };

        const result = await sendAlert(alertPayload);
        alertSent = result.email || result.slack || result.bell;

        console.log('Health drop alert sent:', {
          account: payload.sf_account_id,
          change: `${previousStatus} → ${payload.health_status}`,
          channels: result,
        });
      } else {
        console.log('Health change is not a downgrade, skipping alert:', {
          account: payload.sf_account_id,
          previousStatus,
          newStatus: payload.health_status,
        });
      }
    } else if (payload.type === 'bad_interaction') {
      // Check if this interaction qualifies as "bad"
      const isBad = payload.churn_risk || payload.sentiment_score < 60;

      if (isBad) {
        const alertPayload: BadInteractionAlertPayload = {
          type: 'bad_interaction',
          accountId: payload.sf_account_id,
          accountName: accountInfo.accountName,
          csmUserId: accountInfo.csmUserId,
          csmEmail: accountInfo.csmEmail,
          details: {
            interactionId: payload.interaction_id,
            interactionType: payload.interaction_type,
            sentimentScore: payload.sentiment_score,
            churnRisk: payload.churn_risk,
            churnReasons: payload.churn_reasons,
            summary: payload.insight_summary,
            interactionDate: new Date(payload.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          },
        };

        const result = await sendAlert(alertPayload);
        alertSent = result.email || result.slack || result.bell;

        console.log('Bad interaction alert sent:', {
          account: payload.sf_account_id,
          interactionId: payload.interaction_id,
          churnRisk: payload.churn_risk,
          sentiment: payload.sentiment_score,
          channels: result,
        });
      } else {
        console.log('Interaction does not qualify for alert, skipping:', {
          account: payload.sf_account_id,
          interactionId: payload.interaction_id,
          churnRisk: payload.churn_risk,
          sentiment: payload.sentiment_score,
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "health_drop" or "bad_interaction"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      alertSent,
    });
  } catch (error: any) {
    console.error('Error processing alert webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
