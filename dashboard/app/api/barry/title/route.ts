import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      system: `Generate a very short title (2-5 words) for a chat conversation based on the user's first message.
Return ONLY the title, no quotes, no punctuation at the end.
Examples:
- "What's happening with Acme Corp?" → "Acme Corp Overview"
- "Show me churn risks" → "Churn Risk Review"
- "Identify expansion opportunities" → "Expansion Opportunities"`,
      messages: [{ role: 'user', content: message }],
    });

    const title = response.content[0].type === 'text' ? response.content[0].text.trim() : 'New conversation';

    return new Response(JSON.stringify({ title }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Title Generation] Error:', error);
    return new Response(JSON.stringify({ title: 'New conversation' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
