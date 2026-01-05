import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

// GET - List notifications for the current user
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { user } = authCheck;
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Calculate 3-day TTL cutoff for read notifications
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const ttlCutoff = threeDaysAgo.toISOString();

    // Build query - fetch unread OR (read AND within 3 days)
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .or(`is_read.eq.false,and(is_read.eq.true,read_at.gt.${ttlCutoff})`);

    if (unreadOnly) {
      query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false);
    }

    // Order by created date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count unread notifications
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    });
  } catch (error: any) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new notification (internal use)
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();

    const {
      userId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId
    } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json({
        error: 'Missing required fields: userId, type, title, message'
      }, { status: 400 });
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
