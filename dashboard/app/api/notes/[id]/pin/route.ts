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

// POST - Toggle note pin status
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;

    // Get current note pin status
    const { data: currentNote } = await supabase
      .from('notes')
      .select('is_pinned')
      .eq('id', id)
      .single();

    if (!currentNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Toggle pin status
    const newPinStatus = !currentNote.is_pinned;

    // Update note
    const { data: note, error } = await supabase
      .from('notes')
      .update({ is_pinned: newPinStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling note pin status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error('Error in POST /api/notes/[id]/pin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
