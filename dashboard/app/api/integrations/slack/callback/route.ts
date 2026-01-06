import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { slackConfig, isSlackConfigured } from '@/lib/slack/client';

// Create Supabase client
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Base URL for redirects
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nekter.io';
  const settingsUrl = `${appUrl}/settings`;

  // Handle user cancellation
  if (error) {
    console.error('Slack OAuth error:', error);
    return NextResponse.redirect(`${settingsUrl}?slack=error&message=${encodeURIComponent(error)}`);
  }

  // Validate required params
  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?slack=error&message=Missing+required+parameters`);
  }

  // Check if Slack is configured
  if (!isSlackConfigured()) {
    return NextResponse.redirect(`${settingsUrl}?slack=error&message=Slack+not+configured`);
  }

  // Decode and validate state
  let stateData: { userId: string; timestamp: number };
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString());

    // Check state is not too old (15 minutes)
    if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
      return NextResponse.redirect(`${settingsUrl}?slack=error&message=OAuth+session+expired`);
    }
  } catch {
    return NextResponse.redirect(`${settingsUrl}?slack=error&message=Invalid+state+parameter`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: slackConfig.clientId,
        client_secret: slackConfig.clientSecret,
        code,
        redirect_uri: slackConfig.redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('Slack token exchange failed:', tokenData.error);
      return NextResponse.redirect(
        `${settingsUrl}?slack=error&message=${encodeURIComponent(tokenData.error || 'Token exchange failed')}`
      );
    }

    // Extract data from response
    const {
      access_token: botToken,
      team: { id: teamId, name: teamName },
      bot_user_id: botUserId,
    } = tokenData;

    // Upsert the Slack installation
    const { error: upsertError } = await supabase
      .from('slack_installations')
      .upsert(
        {
          slack_team_id: teamId,
          slack_team_name: teamName,
          bot_token: botToken,
          bot_user_id: botUserId,
          installed_by: stateData.userId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'slack_team_id',
        }
      );

    if (upsertError) {
      console.error('Error saving Slack installation:', upsertError);
      return NextResponse.redirect(`${settingsUrl}?slack=error&message=Failed+to+save+installation`);
    }

    // Also create/update user's Slack settings to link them to this workspace
    await supabase
      .from('user_slack_settings')
      .upsert(
        {
          user_id: stateData.userId,
          slack_team_id: teamId,
          slack_notifications_enabled: false, // User needs to enable manually
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    // Success - redirect back to settings
    return NextResponse.redirect(`${settingsUrl}?slack=success&team=${encodeURIComponent(teamName)}`);
  } catch (err) {
    console.error('Slack OAuth callback error:', err);
    return NextResponse.redirect(`${settingsUrl}?slack=error&message=Unexpected+error`);
  }
}
