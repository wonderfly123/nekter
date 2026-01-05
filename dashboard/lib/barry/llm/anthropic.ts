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
