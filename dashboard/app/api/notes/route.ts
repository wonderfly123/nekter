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

// GET - List notes
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const sfAccountId = searchParams.get('sfAccountId');
    const search = searchParams.get('search');

    if (!sfAccountId) {
      return NextResponse.json({ error: 'sfAccountId is required' }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from('notes')
      .select('*')
      .eq('sf_account_id', sfAccountId);

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Order by: pinned first, then by created date (newest first)
    query = query.order('is_pinned', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data: notes, error } = await query;

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error: any) {
    console.error('Error in GET /api/notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new note
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { user } = authCheck;
    const body = await request.json();

    const {
      sfAccountId,
      title,
      content = '',
      isPinned = false
    } = body;

    // Validate required fields
    if (!sfAccountId || !title) {
      return NextResponse.json({
        error: 'Missing required fields: sfAccountId, title'
      }, { status: 400 });
    }

    // Create note
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        sf_account_id: sfAccountId,
        title,
        content,
        is_pinned: isPinned,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
