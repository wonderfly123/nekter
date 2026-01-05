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
