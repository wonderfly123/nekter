import { NextRequest, NextResponse } from 'next/server';

type BarryResponse = {
  success: boolean;
  response?: string;
  sources?: { type: string; title: string; date: string; account: string | null }[];
  data_count?: number;
  query_filters?: any;
  error?: string;
};

export async function POST(request: NextRequest) {
  console.log('[Barry] Handler called');

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      console.log('[Barry] Failed to parse body');
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { query } = body;
    console.log('[Barry] Received query:', query);

    // Test mode - return early to check basic connectivity
    if (query === 'test') {
      return NextResponse.json({ success: true, response: 'Barry API is working!' });
    }

    if (!query || typeof query !== 'string') {
      return NextResponse.json<BarryResponse>({
        success: false,
        error: 'Query is required',
      }, { status: 400 });
    }

    // Dynamic imports to avoid module loading issues
    console.log('[Barry] Loading modules...');
    const { createLLMService } = await import('@/lib/barry/llm/factory');
    console.log('[Barry] Loaded factory');
    const { searchInteractions } = await import('@/lib/barry/services/data-retrieval');
    console.log('[Barry] Loaded data-retrieval');
    const { buildContext } = await import('@/lib/barry/services/context-builder');
    console.log('[Barry] Loaded context-builder');

    console.log('[Barry] Creating LLM service...');
    const llm = createLLMService();

    // Phase 1: Extract search filters from natural language
    console.log('[Barry] Phase 1: Extracting search params...');
    const filters = await llm.extractSearchParams(query);
    console.log('[Barry] Filters:', JSON.stringify(filters));

    // Handle pleasantries without data lookup
    if (filters.query_type === 'pleasantry' && filters.pleasantry_response) {
      console.log('[Barry] Pleasantry detected, returning quick response');
      return NextResponse.json<BarryResponse>({
        success: true,
        response: filters.pleasantry_response,
        data_count: 0,
      });
    }

    // Phase 2: Retrieve matching interactions
    console.log('[Barry] Phase 2: Searching interactions...');
    const results = await searchInteractions(filters);
    console.log('[Barry] Found', results.length, 'results');

    // Handle no results
    if (results.length === 0) {
      return NextResponse.json<BarryResponse>({
        success: true,
        response: `I couldn't find any interactions matching your query. ${
          filters.account_name
            ? `I searched for "${filters.account_name}" but found no matching accounts or interactions.`
            : 'Try being more specific about which account or topic you want to explore.'
        }`,
        data_count: 0,
        query_filters: filters,
      });
    }

    // Phase 3: Build context for LLM
    const context = await buildContext(results, filters);

    // Phase 4: Generate analysis
    const analysis = await llm.analyzeResults(query, context);

    // Build sources array
    const sources = results.map(r => ({
      type: r.source_type,
      title: r.title,
      date: r.created_at,
      account: r.account_name,
    }));

    return NextResponse.json<BarryResponse>({
      success: true,
      response: analysis,
      sources,
      data_count: results.length,
      query_filters: filters,
    });

  } catch (error) {
    console.error('[Barry] API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json<BarryResponse>({
      success: false,
      error: `Error: ${errorMessage}`,
    }, { status: 500 });
  }
}
