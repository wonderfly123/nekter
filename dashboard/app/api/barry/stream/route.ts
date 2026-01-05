import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Dynamic imports
    const { createLLMService } = await import('@/lib/barry/llm/factory');
    const { searchInteractions } = await import('@/lib/barry/services/data-retrieval');
    const { buildContext } = await import('@/lib/barry/services/context-builder');

    const llm = createLLMService();

    // Phase 1: Extract search filters
    const filters = await llm.extractSearchParams(query);
    console.log('[Barry] Query:', query);
    console.log('[Barry] Extracted filters:', JSON.stringify(filters, null, 2));

    // Handle pleasantries without streaming (quick response)
    if (filters.query_type === 'pleasantry' && filters.pleasantry_response) {
      return new Response(filters.pleasantry_response, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Phase 2: Retrieve matching interactions
    const results = await searchInteractions(filters);

    // Handle no results
    if (results.length === 0) {
      const noResultsMsg = `I couldn't find any interactions matching your query. ${
        filters.account_name
          ? `I searched for "${filters.account_name}" but found no matching accounts or interactions.`
          : 'Try being more specific about which account or topic you want to explore.'
      }`;
      return new Response(noResultsMsg, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Phase 3: Build context
    const context = await buildContext(results, filters);

    // Phase 4: Stream the analysis
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of llm.analyzeResultsStream(query, context)) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();
        } catch (error) {
          console.error('[Barry Stream] Error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('[Barry Stream] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
