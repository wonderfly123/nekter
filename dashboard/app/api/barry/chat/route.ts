import { NextRequest, NextResponse } from 'next/server';
import { createLLMService } from '@/lib/barry/llm/factory';
import { searchInteractions } from '@/lib/barry/services/data-retrieval';
import { buildContext } from '@/lib/barry/services/context-builder';
import { BarryResponse } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json<BarryResponse>({
        success: false,
        error: 'Query is required',
      }, { status: 400 });
    }

    const llm = createLLMService();

    // Phase 1: Extract search filters from natural language
    const filters = await llm.extractSearchParams(query);

    // Phase 2: Retrieve matching interactions
    const results = await searchInteractions(filters);

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
    console.error('Barry API error:', error);
    return NextResponse.json<BarryResponse>({
      success: false,
      error: 'An error occurred while processing your request',
    }, { status: 500 });
  }
}
