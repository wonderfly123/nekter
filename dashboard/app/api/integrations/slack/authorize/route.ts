import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  // Check if Slack is configured
  if (!isSlackConfigured()) {
    return NextResponse.json(
      { error: 'Slack integration is not configured' },
      { status: 500 }
    );
  }

  // Verify user is authenticated
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  // Try to get token from Authorization header or cookie
  let token: string | null = null;
  if (authHeader) {
    token = authHeader.replace('Bearer ', '');
  } else if (cookieHeader) {
    // Extract sb-access-token from cookies
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const accessTokenCookie = cookies.find(c => c.startsWith('sb-') && c.includes('-auth-token'));
    if (accessTokenCookie) {
      try {
        const cookieValue = accessTokenCookie.split('=')[1];
        const decoded = decodeURIComponent(cookieValue);
        const parsed = JSON.parse(decoded);
        token = parsed.access_token;
      } catch {
        // Ignore parse errors
      }
    }
  }

  if (!token) {
    // Redirect to login if not authenticated
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nekter.io';
    return NextResponse.redirect(`${appUrl}/login?redirect=/settings`);
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Generate state parameter for CSRF protection
  // Store user ID in state so we know who initiated the OAuth flow
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
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
