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
