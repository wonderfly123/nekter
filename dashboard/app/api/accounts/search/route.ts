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

// GET - Search accounts by name
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const authCheck = await verifyAuth(authHeader);

    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // Return empty results if query is too short
    if (query.length < 2) {
      return NextResponse.json({ accounts: [] });
    }

    // Search accounts by name (case-insensitive) or account ID
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('sf_account_id, name')
      .or(`name.ilike.%${query}%,sf_account_id.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error searching accounts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: accounts || [] });
  } catch (error: any) {
    console.error('Error in GET /api/accounts/search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
