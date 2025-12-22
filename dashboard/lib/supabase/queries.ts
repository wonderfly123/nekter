import { supabase } from './client';
import type {
  PriorityAccount,
  PortfolioStats,
  AccountDetailData,
  AccountHealth,
  InteractionInsight,
  Account,
} from './types';
import { getDemoDateString } from '../config/demo';
import { calculatePriorityScore, getTopSignals } from '../utils/health-calculations';

/**
 * Get priority accounts (Critical and At Risk) sorted by priority score
 */
export async function getPriorityAccounts(
  includeRenewalsOnly: boolean
): Promise<PriorityAccount[]> {
  const demoDate = getDemoDateString();
  const startOfDay = `${demoDate}T00:00:00`;
  const endOfDay = `${demoDate}T23:59:59`;

  try {
    // Get today's health snapshot for Critical and At Risk accounts
    const { data: healthData, error: healthError } = await supabase
      .from('account_health_history')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .in('health_status', ['Critical', 'At Risk'])
      .order('created_at', { ascending: false });

    if (healthError) throw healthError;
    if (!healthData || healthData.length === 0) return [];

    // Get account details for these accounts
    const accountIds = healthData.map((h) => h.sf_account_id);
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .in('sf_account_id', accountIds);

    if (accountsError) throw accountsError;
    if (!accounts) return [];

    // If filtering by renewals, get renewal opportunities
    let renewalAccountIds: Set<string> | null = null;
    if (includeRenewalsOnly) {
      const ninetyDaysFromNow = new Date(demoDate);
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

      const { data: renewals, error: renewalsError } = await supabase
        .from('opportunities')
        .select('sf_account_id')
        .eq('type', 'Renewal')
        .eq('is_closed', false)
        .lte('close_date', ninetyDaysFromNow.toISOString().split('T')[0]);

      if (renewalsError) throw renewalsError;
      renewalAccountIds = new Set(renewals?.map((r) => r.sf_account_id) || []);
    }

    // Get recent interactions for signal extraction (last 5 per account)
    const interactionsPromises = accountIds.map(async (accountId) => {
      const { data } = await supabase
        .from('interaction_insights')
        .select('*')
        .eq('sf_account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(5);
      return { accountId, interactions: data || [] };
    });

    const interactionsResults = await Promise.all(interactionsPromises);
    const interactionsMap = new Map(
      interactionsResults.map((r) => [r.accountId, r.interactions])
    );

    // Build priority accounts
    const priorityAccounts: PriorityAccount[] = accounts
      .map((account) => {
        const health = healthData.find((h) => h.sf_account_id === account.sf_account_id);
        if (!health) return null;

        // Filter by renewals if needed
        if (renewalAccountIds && !renewalAccountIds.has(account.sf_account_id)) {
          return null;
        }

        const interactions = interactionsMap.get(account.sf_account_id) || [];
        const topSignals = getTopSignals(health, interactions);
        const priorityScore = calculatePriorityScore(account.arr, health.health_status);

        return {
          sf_account_id: account.sf_account_id,
          name: account.name,
          arr: account.arr,
          csm_name: account.csm_name,
          health,
          topSignals,
          priorityScore,
        };
      })
      .filter((acc): acc is PriorityAccount => acc !== null)
      .sort((a, b) => b.priorityScore - a.priorityScore);

    return priorityAccounts;
  } catch (error) {
    console.error('Error fetching priority accounts:', error);
    return [];
  }
}

/**
 * Get dashboard statistics (counts and ARR by health status)
 */
export async function getDashboardStats(): Promise<PortfolioStats> {
  const demoDate = getDemoDateString();
  const startOfDay = `${demoDate}T00:00:00`;
  const endOfDay = `${demoDate}T23:59:59`;

  try {
    // Get today's health snapshot for ALL accounts
    const { data: healthData, error: healthError } = await supabase
      .from('account_health_history')
      .select('sf_account_id, health_status')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (healthError) throw healthError;
    if (!healthData) {
      return {
        criticalCount: 0,
        criticalARR: 0,
        atRiskCount: 0,
        atRiskARR: 0,
        renewalsCount: 0,
        renewalsARR: 0,
        healthyCount: 0,
        healthyARR: 0,
      };
    }

    // Get account details
    const accountIds = healthData.map((h) => h.sf_account_id);
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('sf_account_id, arr')
      .in('sf_account_id', accountIds);

    if (accountsError) throw accountsError;

    // Create a map of account ARR
    const arrMap = new Map(accounts?.map((a) => [a.sf_account_id, a.arr || 0]) || []);

    // Calculate stats by health status
    const stats = healthData.reduce(
      (acc, health) => {
        const arr = arrMap.get(health.sf_account_id) || 0;

        if (health.health_status === 'Critical') {
          acc.criticalCount++;
          acc.criticalARR += arr;
        } else if (health.health_status === 'At Risk') {
          acc.atRiskCount++;
          acc.atRiskARR += arr;
        } else if (health.health_status === 'Healthy') {
          acc.healthyCount++;
          acc.healthyARR += arr;
        }

        return acc;
      },
      {
        criticalCount: 0,
        criticalARR: 0,
        atRiskCount: 0,
        atRiskARR: 0,
        renewalsCount: 0,
        renewalsARR: 0,
        healthyCount: 0,
        healthyARR: 0,
      }
    );

    // Get renewal opportunities (next 90 days)
    const ninetyDaysFromNow = new Date(demoDate);
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const { data: renewals, error: renewalsError } = await supabase
      .from('opportunities')
      .select('sf_account_id, amount')
      .eq('type', 'Renewal')
      .eq('is_closed', false)
      .lte('close_date', ninetyDaysFromNow.toISOString().split('T')[0]);

    if (!renewalsError && renewals) {
      stats.renewalsCount = renewals.length;
      stats.renewalsARR = renewals.reduce((sum, r) => sum + (r.amount || 0), 0);
    }

    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      criticalCount: 0,
      criticalARR: 0,
      atRiskCount: 0,
      atRiskARR: 0,
      renewalsCount: 0,
      renewalsARR: 0,
      healthyCount: 0,
      healthyARR: 0,
    };
  }
}

export async function getAccountDetail(
  sfAccountId: string
): Promise<AccountDetailData | null> {
  // TODO: Implement in Part 3
  return null;
}
