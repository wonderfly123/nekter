import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAllAccounts } from '@/lib/supabase/queries';

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
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const authResult = await verifyAuth(authHeader);

    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const statusParam = searchParams.get('status');
    const healthStatus = statusParam ? statusParam.split(',') : undefined;
    const csmParam = searchParams.get('csm');
    const csmFilter = csmParam ? csmParam.split(',') : undefined;
    const sortBy = searchParams.get('sort') || 'health_score';
    const sortOrder = (searchParams.get('order') || 'asc') as 'asc' | 'desc';

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Fetch accounts
    const result = await getAllAccounts({
      page,
      limit,
      search,
      healthStatus,
      csmFilter,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/accounts/all:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
