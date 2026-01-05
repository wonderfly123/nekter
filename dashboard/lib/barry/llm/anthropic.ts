import Anthropic from '@anthropic-ai/sdk';
import { LLMService, ConversationMessage } from './interface';
import { SearchFilters } from '@/lib/supabase/types';
import { QUERY_EXTRACTION_PROMPT, ANALYSIS_SYSTEM_PROMPT } from '../prompts';

export class AnthropicService implements LLMService {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async extractSearchParams(userQuery: string, conversationHistory: ConversationMessage[] = []): Promise<SearchFilters> {
    // Build messages with conversation history for context
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history for context
    if (conversationHistory.length > 0) {
      const historyContext = conversationHistory
        .slice(-6) // Last 3 exchanges
        .map(m => `${m.role === 'user' ? 'User' : 'Barry'}: ${m.content.slice(0, 1500)}`)
        .join('\n');
      messages.push({
        role: 'user',
        content: `Previous conversation for context:\n${historyContext}\n\n---\n\nNow extract filters for this new query: ${userQuery}`
      });
    } else {
      messages.push({ role: 'user', content: userQuery });
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: QUERY_EXTRACTION_PROMPT,
      messages,
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
        pleasantry_response: parsed.pleasantry_response || null,
        churn_risk: parsed.churn_risk ?? null,
        expansion_opportunity: parsed.expansion_opportunity ?? null,
        health_status: parsed.health_status || null,
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
        churn_risk: null,
        expansion_opportunity: null,
        health_status: null,
      };
    }
  }

  async analyzeResults(userQuery: string, context: string, conversationHistory: ConversationMessage[] = []): Promise<string> {
    // Build messages with full conversation history
    const messages: Anthropic.MessageParam[] = [];

    // Add previous conversation exchanges
    for (const msg of conversationHistory.slice(-10)) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add current query with context
    messages.push({
      role: 'user',
      content: `User Question: ${userQuery}\n\n${context}`,
    });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages,
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async *analyzeResultsStream(userQuery: string, context: string, conversationHistory: ConversationMessage[] = []): AsyncIterable<string> {
    // Build messages with full conversation history
    const messages: Anthropic.MessageParam[] = [];

    // Add previous conversation exchanges
    for (const msg of conversationHistory.slice(-10)) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add current query with context
    messages.push({
      role: 'user',
      content: `User Question: ${userQuery}\n\n${context}`,
    });

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}
