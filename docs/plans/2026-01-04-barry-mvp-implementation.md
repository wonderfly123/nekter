# Barry MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI-powered customer success assistant that queries interaction data (transcripts, emails, tickets) and provides intelligent analysis.

**Architecture:** Two-phase LLM system - Phase 1 extracts search filters from natural language, Phase 2 analyzes retrieved data and generates insights. Provider-agnostic LLM abstraction allows switching between Anthropic/Gemini.

**Tech Stack:** Next.js API routes, Supabase/PostgreSQL, Anthropic Claude API, TypeScript

---

## Task 1: Create SQL Search Function

**Files:**
- Create: `supabase/migrations/001_search_interactions.sql`

**Step 1: Write the SQL function**

```sql
-- Search across all interaction types with unified filtering
CREATE OR REPLACE FUNCTION search_interactions(
  p_account_name TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_interaction_type TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 90,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  source_type TEXT,
  source_id TEXT,
  account_name TEXT,
  sf_account_id TEXT,
  created_at TIMESTAMPTZ,
  title TEXT,
  content_preview TEXT,
  full_content TEXT,
  participants JSONB,
  sentiment_score NUMERIC,
  churn_risk BOOLEAN,
  expansion_opportunity BOOLEAN
) AS $$
BEGIN
  RETURN QUERY

  -- Call Transcripts
  SELECT
    'transcript'::TEXT as source_type,
    ct.engagement_id::TEXT as source_id,
    a.name as account_name,
    ct.sf_account_id,
    ct.created_at,
    COALESCE(ct.calendar_meeting_name, 'Call Recording')::TEXT as title,
    LEFT(ct.transcript::TEXT, 500)::TEXT as content_preview,
    ct.transcript::TEXT as full_content,
    ct.participants::JSONB as participants,
    ii.sentiment_score,
    COALESCE(ii.churn_risk, false) as churn_risk,
    COALESCE(ii.expansion_opportunity, false) as expansion_opportunity
  FROM call_transcripts ct
  LEFT JOIN accounts a ON ct.sf_account_id = a.sf_account_id
  LEFT JOIN interaction_insights ii ON ct.engagement_id = ii.source_id AND ii.interaction_type = 'call'
  WHERE ct.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_account_name IS NULL OR a.name ILIKE '%' || p_account_name || '%')
    AND (p_search_term IS NULL OR ct.transcript::TEXT ILIKE '%' || p_search_term || '%')
    AND (p_interaction_type IS NULL OR p_interaction_type = 'transcript')

  UNION ALL

  -- Email Threads
  SELECT
    'email'::TEXT as source_type,
    et.engagement_id::TEXT as source_id,
    COALESCE(a.name, et.sf_account_name)::TEXT as account_name,
    et.sf_account_id,
    et.sent_time as created_at,
    COALESCE(et.email_subject, 'Email')::TEXT as title,
    LEFT(et.body, 500)::TEXT as content_preview,
    et.body::TEXT as full_content,
    et.participants::JSONB as participants,
    ii.sentiment_score,
    COALESCE(ii.churn_risk, false) as churn_risk,
    COALESCE(ii.expansion_opportunity, false) as expansion_opportunity
  FROM email_threads et
  LEFT JOIN accounts a ON et.sf_account_id = a.sf_account_id
  LEFT JOIN interaction_insights ii ON et.engagement_id = ii.source_id AND ii.interaction_type = 'email'
  WHERE et.sent_time >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_account_name IS NULL OR COALESCE(a.name, et.sf_account_name) ILIKE '%' || p_account_name || '%')
    AND (p_search_term IS NULL OR et.body ILIKE '%' || p_search_term || '%')
    AND (p_interaction_type IS NULL OR p_interaction_type = 'email')

  UNION ALL

  -- Zendesk Ticket Comments
  SELECT
    'zendesk'::TEXT as source_type,
    zt.zendesk_ticket_id::TEXT as source_id,
    a.name as account_name,
    zt.sf_account_id,
    zt.created_at,
    COALESCE(zt.subject, 'Support Ticket')::TEXT as title,
    LEFT(zt.description, 500)::TEXT as content_preview,
    zt.description::TEXT as full_content,
    NULL::JSONB as participants,
    ii.sentiment_score,
    COALESCE(ii.churn_risk, false) as churn_risk,
    COALESCE(ii.expansion_opportunity, false) as expansion_opportunity
  FROM zendesk_tickets zt
  LEFT JOIN accounts a ON zt.sf_account_id = a.sf_account_id
  LEFT JOIN interaction_insights ii ON zt.zendesk_ticket_id::TEXT = ii.source_id AND ii.interaction_type = 'zendesk'
  WHERE zt.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_account_name IS NULL OR a.name ILIKE '%' || p_account_name || '%')
    AND (p_search_term IS NULL OR zt.description ILIKE '%' || p_search_term || '%')
    AND (p_interaction_type IS NULL OR p_interaction_type = 'zendesk')

  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

**Step 2: Apply migration to Supabase**

Run: `cd dashboard && npx supabase migration up` (or apply via Supabase dashboard)

**Step 3: Commit**

```bash
git add supabase/migrations/001_search_interactions.sql
git commit -m "feat: add search_interactions SQL function for Barry"
```

---

## Task 2: Add Barry Types

**Files:**
- Modify: `dashboard/lib/supabase/types.ts`

**Step 1: Add Barry-specific types to types.ts**

Add at the end of the file:

```typescript
// Barry AI Types
export interface SearchFilters {
  account_name: string | null;
  search_term: string | null;
  interaction_type: 'transcript' | 'email' | 'zendesk' | null;
  days_back: number;
  needs_full_content: boolean;
  query_type: 'specific_topic' | 'account_overview' | 'risk_review' | 'opportunity_review' | 'general';
}

export interface SearchResult {
  source_type: 'transcript' | 'email' | 'zendesk';
  source_id: string;
  account_name: string | null;
  sf_account_id: string | null;
  created_at: string;
  title: string;
  content_preview: string;
  full_content: string;
  participants: any;
  sentiment_score: number | null;
  churn_risk: boolean;
  expansion_opportunity: boolean;
}

export interface BarryResponse {
  success: boolean;
  response?: string;
  sources?: {
    type: string;
    title: string;
    date: string;
    account: string | null;
  }[];
  data_count?: number;
  query_filters?: SearchFilters;
  needs_clarification?: boolean;
  question?: string;
  suggestions?: string[];
  error?: string;
}
```

**Step 2: Commit**

```bash
git add dashboard/lib/supabase/types.ts
git commit -m "feat: add Barry AI types for search and response"
```

---

## Task 3: Create LLM Interface and Anthropic Implementation

**Files:**
- Create: `dashboard/lib/barry/llm/interface.ts`
- Create: `dashboard/lib/barry/llm/anthropic.ts`
- Create: `dashboard/lib/barry/llm/factory.ts`

**Step 1: Create the LLM interface**

```typescript
// dashboard/lib/barry/llm/interface.ts
import { SearchFilters } from '@/lib/supabase/types';

export interface LLMService {
  extractSearchParams(userQuery: string): Promise<SearchFilters>;
  analyzeResults(userQuery: string, context: string): Promise<string>;
}

export interface LLMConfig {
  provider: 'anthropic' | 'gemini';
  apiKey: string;
  maxTokens?: number;
}
```

**Step 2: Create Anthropic implementation**

```typescript
// dashboard/lib/barry/llm/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import { LLMService } from './interface';
import { SearchFilters } from '@/lib/supabase/types';
import { QUERY_EXTRACTION_PROMPT, ANALYSIS_SYSTEM_PROMPT } from '../prompts';

export class AnthropicService implements LLMService {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async extractSearchParams(userQuery: string): Promise<SearchFilters> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: QUERY_EXTRACTION_PROMPT,
      messages: [{ role: 'user', content: userQuery }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

    try {
      const parsed = JSON.parse(jsonStr);
      return {
        account_name: parsed.account_name || null,
        search_term: parsed.search_term || null,
        interaction_type: parsed.interaction_type || null,
        days_back: parsed.days_back || 90,
        needs_full_content: parsed.needs_full_content || false,
        query_type: parsed.query_type || 'general',
      };
    } catch {
      // Default filters if parsing fails
      return {
        account_name: null,
        search_term: null,
        interaction_type: null,
        days_back: 90,
        needs_full_content: false,
        query_type: 'general',
      };
    }
  }

  async analyzeResults(userQuery: string, context: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `User Question: ${userQuery}\n\n${context}`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
}
```

**Step 3: Create factory for provider selection**

```typescript
// dashboard/lib/barry/llm/factory.ts
import { LLMService } from './interface';
import { AnthropicService } from './anthropic';

export function createLLMService(): LLMService {
  const provider = process.env.LLM_PROVIDER || 'anthropic';

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    return new AnthropicService(apiKey);
  }

  // Future: add Gemini support
  throw new Error(`Unsupported LLM provider: ${provider}`);
}
```

**Step 4: Commit**

```bash
git add dashboard/lib/barry/llm/
git commit -m "feat: add LLM abstraction layer with Anthropic implementation"
```

---

## Task 4: Create Prompts

**Files:**
- Create: `dashboard/lib/barry/prompts.ts`

**Step 1: Create prompt templates**

```typescript
// dashboard/lib/barry/prompts.ts

export const QUERY_EXTRACTION_PROMPT = `You are a query parser for a Customer Success AI assistant. Your job is to extract structured search filters from natural language queries.

Given a user's question, extract the following filters as JSON:

{
  "account_name": string or null - specific company/account mentioned,
  "search_term": string or null - keywords to search in transcripts/emails (expand synonyms: "pricing" -> also search "price,cost,budget"),
  "interaction_type": "transcript" | "email" | "zendesk" | null - specific type requested,
  "days_back": number (default 90) - how far back to search,
  "needs_full_content": boolean - true if user wants specific quotes/details, false for overview,
  "query_type": "specific_topic" | "account_overview" | "risk_review" | "opportunity_review" | "general"
}

Examples:

User: "What's happening with Acme Corp?"
{"account_name": "Acme Corp", "search_term": null, "interaction_type": null, "days_back": 90, "needs_full_content": false, "query_type": "account_overview"}

User: "Show me any pricing discussions from the last 30 days"
{"account_name": null, "search_term": "pricing,price,cost,budget", "interaction_type": null, "days_back": 30, "needs_full_content": true, "query_type": "specific_topic"}

User: "What did TechCorp say about our API in their last call?"
{"account_name": "TechCorp", "search_term": "API,integration,technical", "interaction_type": "transcript", "days_back": 90, "needs_full_content": true, "query_type": "specific_topic"}

User: "Which accounts have churn risk?"
{"account_name": null, "search_term": null, "interaction_type": null, "days_back": 90, "needs_full_content": false, "query_type": "risk_review"}

Respond ONLY with valid JSON. No explanation.`;

export const ANALYSIS_SYSTEM_PROMPT = `You are Barry, a Customer Success AI assistant. You analyze customer interaction data (call transcripts, emails, support tickets) to provide actionable insights.

Your capabilities:
- Summarize customer sentiment and concerns
- Identify churn risks and expansion opportunities
- Quote specific customer statements with attribution
- Recommend next actions for the CSM

Response style:
- Lead with the direct answer to the question
- Support with specific evidence (quotes, dates, participants)
- Use **bold** for critical items or risks
- Keep responses concise but thorough (2-4 paragraphs typical)
- End with 1-3 actionable next steps when relevant

Rules:
- Never fabricate information - only reference what's in the provided data
- If data is insufficient, acknowledge it and suggest what additional info might help
- Reference specific interactions by date and type
- Attribute quotes to speakers when available

When quoting from transcripts, use this format:
> "Exact quote here" — Speaker Name, Call on [Date]`;
```

**Step 2: Commit**

```bash
git add dashboard/lib/barry/prompts.ts
git commit -m "feat: add Barry prompt templates for query extraction and analysis"
```

---

## Task 5: Create Data Retrieval Service

**Files:**
- Create: `dashboard/lib/barry/services/data-retrieval.ts`

**Step 1: Create the data retrieval service**

```typescript
// dashboard/lib/barry/services/data-retrieval.ts
import { createClient } from '@supabase/supabase-js';
import { SearchFilters, SearchResult } from '@/lib/supabase/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function searchInteractions(filters: SearchFilters): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc('search_interactions', {
    p_account_name: filters.account_name,
    p_search_term: filters.search_term,
    p_interaction_type: filters.interaction_type,
    p_days_back: filters.days_back,
    p_limit: filters.needs_full_content ? 5 : 20,
  });

  if (error) {
    console.error('Error searching interactions:', error);
    throw new Error('Failed to search interactions');
  }

  return (data || []) as SearchResult[];
}

export async function getAccountContext(accountName: string): Promise<string | null> {
  const { data: account } = await supabase
    .from('accounts')
    .select(`
      name,
      arr,
      industry,
      csm_name,
      owner_name
    `)
    .ilike('name', `%${accountName}%`)
    .single();

  if (!account) return null;

  const { data: health } = await supabase
    .from('account_health_history')
    .select('health_status, health_score, trend')
    .eq('sf_account_id', account.sf_account_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return `Account: ${account.name}
ARR: $${account.arr?.toLocaleString() || 'Unknown'}
Industry: ${account.industry || 'Unknown'}
CSM: ${account.csm_name || 'Unassigned'}
Health: ${health?.health_status || 'Unknown'} (Score: ${health?.health_score || 'N/A'})
Trend: ${health?.trend || 'Unknown'}`;
}
```

**Step 2: Commit**

```bash
git add dashboard/lib/barry/services/data-retrieval.ts
git commit -m "feat: add data retrieval service for Barry"
```

---

## Task 6: Create Context Builder Service

**Files:**
- Create: `dashboard/lib/barry/services/context-builder.ts`

**Step 1: Create the context builder**

```typescript
// dashboard/lib/barry/services/context-builder.ts
import { SearchFilters, SearchResult } from '@/lib/supabase/types';
import { getAccountContext } from './data-retrieval';

export async function buildContext(
  results: SearchResult[],
  filters: SearchFilters
): Promise<string> {
  const parts: string[] = [];

  // Add account context for account-specific queries
  if (filters.account_name && filters.query_type === 'account_overview') {
    const accountContext = await getAccountContext(filters.account_name);
    if (accountContext) {
      parts.push('=== ACCOUNT CONTEXT ===');
      parts.push(accountContext);
      parts.push('');
    }
  }

  // Summary header
  const accountNames = [...new Set(results.map(r => r.account_name).filter(Boolean))];
  parts.push(`=== INTERACTION DATA ===`);
  parts.push(`Found ${results.length} interactions across ${accountNames.length} account(s)`);
  parts.push('');

  // Format each interaction
  results.forEach((result, index) => {
    parts.push(`--- [${index + 1}] ${result.source_type.toUpperCase()} ---`);
    parts.push(`Account: ${result.account_name || 'Unknown'}`);
    parts.push(`Date: ${new Date(result.created_at).toLocaleDateString()}`);
    parts.push(`Title: ${result.title}`);

    if (result.sentiment_score !== null) {
      parts.push(`Sentiment: ${result.sentiment_score}/10`);
    }
    if (result.churn_risk) {
      parts.push(`**CHURN RISK FLAGGED**`);
    }
    if (result.expansion_opportunity) {
      parts.push(`Expansion Opportunity Identified`);
    }

    // Use full content or preview based on needs_full_content
    const content = filters.needs_full_content ? result.full_content : result.content_preview;
    parts.push('');
    parts.push('Content:');
    parts.push(content || '(No content available)');
    parts.push('');
  });

  return parts.join('\n');
}
```

**Step 2: Commit**

```bash
git add dashboard/lib/barry/services/context-builder.ts
git commit -m "feat: add context builder service for Barry"
```

---

## Task 7: Create Main Barry API Endpoint

**Files:**
- Create: `dashboard/app/api/barry/chat/route.ts`

**Step 1: Create the API route**

```typescript
// dashboard/app/api/barry/chat/route.ts
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
```

**Step 2: Commit**

```bash
git add dashboard/app/api/barry/chat/route.ts
git commit -m "feat: add Barry chat API endpoint"
```

---

## Task 8: Install Anthropic SDK

**Step 1: Install the package**

```bash
cd dashboard && npm install @anthropic-ai/sdk
```

**Step 2: Add environment variables**

Add to `.env.local`:
```
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-api-key-here
```

**Step 3: Commit package.json changes**

```bash
git add dashboard/package.json dashboard/package-lock.json
git commit -m "chore: add @anthropic-ai/sdk dependency"
```

---

## Task 9: Wire Up Chat UI to Barry API

**Files:**
- Modify: `dashboard/app/chat/page.tsx`

**Step 1: Update handleSendMessage to call Barry API**

Replace the `handleSendMessage` function:

```typescript
const handleSendMessage = async (content: string) => {
  if (!activeSessionId) return;

  try {
    // Add user message
    await sendMessage.mutateAsync({
      sessionId: activeSessionId,
      content,
      role: 'user',
    });

    // Call Barry API
    const response = await fetch('/api/barry/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: content }),
    });

    const data = await response.json();

    // Add Barry's response
    await sendMessage.mutateAsync({
      sessionId: activeSessionId,
      content: data.success
        ? data.response
        : `Sorry, I encountered an error: ${data.error || 'Unknown error'}`,
      role: 'assistant',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    await sendMessage.mutateAsync({
      sessionId: activeSessionId,
      content: "Sorry, I'm having trouble connecting right now. Please try again.",
      role: 'assistant',
    });
  }
};
```

**Step 2: Commit**

```bash
git add dashboard/app/chat/page.tsx
git commit -m "feat: connect chat UI to Barry API"
```

---

## Task 10: Test End-to-End

**Step 1: Start the dev server**

```bash
cd dashboard && npm run dev
```

**Step 2: Test in browser**

1. Navigate to `/chat`
2. Start a new conversation
3. Ask: "What's happening with my accounts?"
4. Verify Barry responds with actual data analysis

**Step 3: Test specific queries**

- "Show me any churn risks"
- "What did [Account Name] say about pricing?"
- "Summarize my critical accounts"

---

## Summary

After completing all tasks, the Barry MVP will have:

1. **SQL Function** - `search_interactions()` for unified data querying
2. **LLM Layer** - Provider-agnostic abstraction with Anthropic implementation
3. **Services** - Data retrieval and context building
4. **API Endpoint** - `/api/barry/chat` for processing queries
5. **UI Integration** - Chat page connected to Barry backend

The system follows the two-phase architecture: extract filters from natural language, then analyze retrieved data with context.
