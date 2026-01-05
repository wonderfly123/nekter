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
