import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's slack settings to find their team
    const { data: userSettings } = await supabase
      .from('user_slack_settings')
      .select('slack_team_id')
      .eq('user_id', userId)
      .single();

    // Delete user's slack settings
    await supabase
      .from('user_slack_settings')
      .delete()
      .eq('user_id', userId);

    // If this was the last user connected to this workspace, delete the installation
    if (userSettings?.slack_team_id) {
      const { count } = await supabase
        .from('user_slack_settings')
        .select('*', { count: 'exact', head: true })
        .eq('slack_team_id', userSettings.slack_team_id);

      if (count === 0) {
        await supabase
          .from('slack_installations')
          .delete()
          .eq('slack_team_id', userSettings.slack_team_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Slack:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
