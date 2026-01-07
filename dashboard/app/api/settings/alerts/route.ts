import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getAllUserAlertSettings, updateUserAlertSettings } from '@/lib/alerts/settings';
import type { AlertType } from '@/lib/alerts/types';

// Create Supabase client for auth verification
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

// Verify user authentication
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  return { user };
}

/**
 * GET /api/settings/alerts
 * Returns the current user's alert settings for all alert types
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { user } = authCheck;
    const settings = await getAllUserAlertSettings(user.id);

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error in GET /api/settings/alerts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/settings/alerts
 * Updates the current user's alert settings for a specific alert type
 *
 * Request body:
 * {
 *   alertType: 'health_drop' | 'bad_interaction',
 *   emailEnabled: boolean,
 *   slackEnabled: boolean,
 *   bellEnabled: boolean
 * }
 */
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { user } = authCheck;
    const body = await request.json();

    const { alertType, emailEnabled, slackEnabled, bellEnabled } = body;

    // Validate alert type
    if (!alertType || !['health_drop', 'bad_interaction', 'expansion_opportunity'].includes(alertType)) {
      return NextResponse.json(
        { error: 'Invalid alertType. Must be "health_drop", "bad_interaction", or "expansion_opportunity"' },
        { status: 400 }
      );
    }

    // Validate boolean fields
    if (
      typeof emailEnabled !== 'boolean' ||
      typeof slackEnabled !== 'boolean' ||
      typeof bellEnabled !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'emailEnabled, slackEnabled, and bellEnabled must be booleans' },
        { status: 400 }
      );
    }

    const result = await updateUserAlertSettings(user.id, alertType as AlertType, {
      email_enabled: emailEnabled,
      slack_enabled: slackEnabled,
      bell_enabled: bellEnabled,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in PUT /api/settings/alerts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
