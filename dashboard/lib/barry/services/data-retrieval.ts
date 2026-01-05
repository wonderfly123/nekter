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
  const { data: accounts } = await supabase
    .from('accounts')
    .select('sf_account_id, name, arr, industry, csm_name, owner_name')
    .ilike('name', `%${accountName}%`)
    .limit(1);

  const account = accounts?.[0];
  if (!account) return null;

  const { data: healthData } = await supabase
    .from('account_health_history')
    .select('health_status, health_score, trend')
    .eq('sf_account_id', account.sf_account_id)
    .order('created_at', { ascending: false })
    .limit(1);

  const health = healthData?.[0];

  return `Account: ${account.name}
ARR: $${account.arr?.toLocaleString() || 'Unknown'}
Industry: ${account.industry || 'Unknown'}
CSM: ${account.csm_name || 'Unassigned'}
Health: ${health?.health_status || 'Unknown'} (Score: ${health?.health_score || 'N/A'})
Trend: ${health?.trend || 'Unknown'}`;
}
