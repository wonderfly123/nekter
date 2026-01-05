import { SearchFilters } from '@/lib/supabase/types';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMService {
  extractSearchParams(userQuery: string, conversationHistory?: ConversationMessage[]): Promise<SearchFilters>;
  analyzeResults(userQuery: string, context: string, conversationHistory?: ConversationMessage[]): Promise<string>;
  analyzeResultsStream(userQuery: string, context: string, conversationHistory?: ConversationMessage[]): AsyncIterable<string>;
}

export interface LLMConfig {
  provider: 'anthropic' | 'gemini';
  apiKey: string;
  maxTokens?: number;
}
