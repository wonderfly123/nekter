import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SearchFilters, SearchResult } from '@/lib/supabase/types';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

export async function searchInteractions(filters: SearchFilters): Promise<SearchResult[]> {
  const rpcParams = {
    p_account_name: filters.account_name,
    p_search_term: filters.search_term,
    p_interaction_type: filters.interaction_type,
    p_days_back: filters.days_back,
    p_limit: filters.needs_full_content ? 5 : 20,
    p_churn_risk: filters.churn_risk ?? null,
    p_expansion_opportunity: filters.expansion_opportunity ?? null,
    p_health_status: filters.health_status ?? null,
  };
  console.log('[Barry] RPC params:', JSON.stringify(rpcParams, null, 2));

  const { data, error } = await getSupabase().rpc('search_interactions', rpcParams);
  console.log('[Barry] RPC result count:', data?.length ?? 0);

  if (error) {
    console.error('Error searching interactions:', error);
    throw new Error('Failed to search interactions');
  }

  return (data || []) as SearchResult[];
}

export async function getAccountContext(accountName: string): Promise<string | null> {
  const { data: accounts } = await getSupabase()
    .from('accounts')
    .select('sf_account_id, name, arr, industry, csm_name, owner_name')
    .ilike('name', `%${accountName}%`)
    .limit(1);

  const account = accounts?.[0];
  if (!account) return null;

  const { data: healthData } = await getSupabase()
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
