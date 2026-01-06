import { NextResponse } from 'next/server';
import { slackConfig, isSlackConfigured } from '@/lib/slack/client';

export async function GET(request: Request) {
  // Check if Slack is configured
  if (!isSlackConfigured()) {
    return NextResponse.json(
      { error: 'Slack integration is not configured' },
      { status: 500 }
    );
  }

  // Get user ID from query param (passed from authenticated client)
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID required' },
      { status: 400 }
    );
  }

  // Generate state parameter for CSRF protection
  // Store user ID in state so we know who initiated the OAuth flow
  const state = Buffer.from(JSON.stringify({
    userId,
    timestamp: Date.now(),
  })).toString('base64');

  // Build Slack OAuth URL
  const slackOAuthUrl = new URL('https://slack.com/oauth/v2/authorize');
  slackOAuthUrl.searchParams.set('client_id', slackConfig.clientId);
  slackOAuthUrl.searchParams.set('scope', slackConfig.scopes);
  slackOAuthUrl.searchParams.set('redirect_uri', slackConfig.redirectUri);
  slackOAuthUrl.searchParams.set('state', state);

  // Redirect to Slack
  return NextResponse.redirect(slackOAuthUrl.toString());
}
