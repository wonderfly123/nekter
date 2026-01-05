import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy-load Supabase client
let supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query, sessionId } = await request.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch conversation history if sessionId provided
    let conversationHistory: ConversationMessage[] = [];
    if (sessionId) {
      const { data: messages } = await getSupabase()
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(20) as { data: { role: string; content: string }[] | null };

      if (messages && messages.length > 0) {
        // Exclude the current message (last user message) since we pass it separately
        conversationHistory = messages.slice(0, -1).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));
      }
    }
    console.log('[Barry] Conversation history length:', conversationHistory.length);

    // Dynamic imports
    const { createLLMService } = await import('@/lib/barry/llm/factory');
    const { searchInteractions } = await import('@/lib/barry/services/data-retrieval');
    const { buildContext } = await import('@/lib/barry/services/context-builder');

    const llm = createLLMService();

    // Phase 1: Extract search filters (with conversation context)
    const filters = await llm.extractSearchParams(query, conversationHistory);
    console.log('[Barry] Query:', query);
    console.log('[Barry] Extracted filters:', JSON.stringify(filters, null, 2));

    // Handle pleasantries without streaming (quick response)
    if (filters.query_type === 'pleasantry' && filters.pleasantry_response) {
      return new Response(filters.pleasantry_response, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Phase 2: Retrieve matching interactions (if filters suggest we need data)
    const needsData = filters.account_name || filters.search_term || filters.churn_risk ||
                      filters.expansion_opportunity || filters.health_status;

    let context = '';
    if (needsData) {
      const results = await searchInteractions(filters);
      if (results.length > 0) {
        context = await buildContext(results, filters);
      } else if (filters.account_name) {
        // Only add "no results" context if they asked for a specific account
        context = `No interactions found for "${filters.account_name}". The account may not exist in the system or may not have any recorded interactions.`;
      }
    }

    // Phase 4: Stream the analysis (with conversation history)
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of llm.analyzeResultsStream(query, context, conversationHistory)) {
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
