import { supabase } from './client';
import type {
  PriorityAccount,
  PortfolioStats,
  AccountDetailData,
  AccountHealth,
  InteractionInsight,
  Account,
  PortfolioOverviewStats,
  PortfolioHealthHistoryPoint,
  RenewalForecastData,
} from './types';
import { getDemoDateString } from '../config/demo';
import { calculatePriorityScore, getTopSignals } from '../utils/health-calculations';
import { calculateMetrics } from '../utils/metrics-calculations';

/**
 * Get priority accounts (Critical and At Risk) sorted by priority score
 */
export async function getPriorityAccounts(
  includeRenewalsOnly: boolean
): Promise<PriorityAccount[]> {
  const demoDate = getDemoDateString();
  const ninetyDaysAgo = new Date(new Date(demoDate).getTime() - 90 * 24 * 60 * 60 * 1000);

  try {
    // Get latest health snapshot for Critical and At Risk accounts
    const { data: healthData, error: healthError } = await supabase
      .from('account_health_history')
      .select('health_status, health_score, trend, id, sf_account_id, created_at')
      .in('health_status', ['Critical', 'At Risk'])
      .order('created_at', { ascending: false });

    if (healthError) throw healthError;
    if (!healthData || healthData.length === 0) return [];

    // Get most recent health record per account
    const latestHealthMap = new Map<string, AccountHealth>();
    healthData.forEach((h) => {
      if (!latestHealthMap.has(h.sf_account_id)) {
        latestHealthMap.set(h.sf_account_id, h);
      }
    });

    const accountIds = Array.from(latestHealthMap.keys());

    // Get account details for these accounts
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

    // Get interactions and tickets for each account in parallel
    const dataPromises = accountIds.map(async (accountId) => {
      const [interactionsResult, ticketsResult] = await Promise.all([
        supabase
          .from('interaction_insights')
          .select('*')
          .eq('sf_account_id', accountId)
          .gte('created_at', ninetyDaysAgo.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('zendesk_tickets')
          .select('*')
          .eq('sf_account_id', accountId)
          .in('status', ['new', 'open']),
      ]);

      return {
        accountId,
        interactions: interactionsResult.data || [],
        tickets: ticketsResult.data || [],
      };
    });

    const dataResults = await Promise.all(dataPromises);
    const dataMap = new Map(dataResults.map((r) => [r.accountId, r]));

    // Build priority accounts
    const priorityAccounts: PriorityAccount[] = accounts
      .map((account) => {
        const health = latestHealthMap.get(account.sf_account_id);
        if (!health) return null;

        // Filter by renewals if needed
        if (renewalAccountIds && !renewalAccountIds.has(account.sf_account_id)) {
          return null;
        }

        const accountData = dataMap.get(account.sf_account_id);
        const interactions = accountData?.interactions || [];
        const tickets = accountData?.tickets || [];

        // Calculate metrics on-the-fly
        const metrics = calculateMetrics(
          interactions,
          tickets,
          account.last_activity_date
        );

        // Get top signals
        const topSignals = getTopSignals(
          metrics.avgSentiment,
          metrics.churnSignals,
          metrics.openTicketCount,
          metrics.daysSinceActivity,
          interactions
        );

        const priorityScore = calculatePriorityScore(account.arr, health.health_status);

        return {
          sf_account_id: account.sf_account_id,
          name: account.name,
          arr: account.arr,
          csm_name: account.csm_name,
          health,
          metrics,
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

/**
 * Get detailed account information with all related data
 */
export async function getAccountDetail(
  sfAccountId: string
): Promise<AccountDetailData | null> {
  const demoDate = getDemoDateString();
  const startOfDay = `${demoDate}T00:00:00`;
  const endOfDay = `${demoDate}T23:59:59`;

  try {
    // Run all queries in parallel for performance
    const [
      accountResult,
      currentHealthResult,
      healthHistoryResult,
      interactionsResult,
      contactsResult,
      ticketsResult,
      opportunitiesResult,
      supportTierResult,
    ] = await Promise.all([
      // 1. Get account base data
      supabase
        .from('accounts')
        .select('*')
        .eq('sf_account_id', sfAccountId)
        .single(),

      // 2. Get current health status (most recent)
      // Fetch: health_status, health_score, trend, id, sf_account_id, created_at
      supabase
        .from('account_health_history')
        .select('health_status, health_score, trend, id, sf_account_id, created_at')
        .eq('sf_account_id', sfAccountId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 3. Get 90-day health history for trend chart
      // Fetch: health_status, health_score, trend, id, sf_account_id, created_at
      supabase
        .from('account_health_history')
        .select('health_status, health_score, trend, id, sf_account_id, created_at')
        .eq('sf_account_id', sfAccountId)
        .gte(
          'created_at',
          new Date(new Date(demoDate).getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('created_at', { ascending: true }),

      // 4. Get recent interactions (90 days)
      supabase
        .from('interaction_insights')
        .select('*')
        .eq('sf_account_id', sfAccountId)
        .gte(
          'created_at',
          new Date(new Date(demoDate).getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
        )
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false }),

      // 5. Get contacts
      supabase
        .from('contacts')
        .select('*')
        .eq('sf_account_id', sfAccountId)
        .order('last_activity_date', { ascending: false }),

      // 6. Get open tickets
      supabase
        .from('zendesk_tickets')
        .select('*')
        .eq('sf_account_id', sfAccountId)
        .in('status', ['new', 'open'])
        .order('created_at', { ascending: false }),

      // 7. Get opportunities
      supabase
        .from('opportunities')
        .select('*')
        .eq('sf_account_id', sfAccountId)
        .eq('is_closed', false)
        .order('close_date', { ascending: true }),

      // 8. Get support tier from zendesk_org_mapping
      supabase
        .from('zendesk_org_mapping')
        .select('tier')
        .eq('sf_account_id', sfAccountId)
        .limit(1)
        .maybeSingle(),
    ]);

    // Check for errors
    if (accountResult.error) {
      console.error('Error fetching account:', accountResult.error);
      throw accountResult.error;
    }
    if (currentHealthResult.error) {
      console.error('Error fetching current health:', currentHealthResult.error);
      throw currentHealthResult.error;
    }

    // Account must exist
    if (!accountResult.data) {
      console.error('Account not found:', sfAccountId);
      return null;
    }

    // Current health must exist
    if (!currentHealthResult.data) {
      console.error('Current health not found for account:', sfAccountId);
      return null;
    }

    // Find renewal opportunity (next 90 days)
    const ninetyDaysFromNow = new Date(demoDate);
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const renewalOpportunity =
      opportunitiesResult.data?.find(
        (opp) =>
          opp.type === 'Renewal' &&
          opp.close_date &&
          new Date(opp.close_date) <= ninetyDaysFromNow
      ) || null;

    // Check if champion left
    const championLeft =
      contactsResult.data?.some(
        (contact) =>
          contact.customer_role === 'Champion' && contact.left_company === true
      ) || false;

    // Calculate metrics on-the-fly from source data
    const metrics = calculateMetrics(
      interactionsResult.data || [],
      ticketsResult.data || [],
      accountResult.data.last_activity_date
    );

    return {
      account: accountResult.data,
      currentHealth: currentHealthResult.data,
      healthHistory: healthHistoryResult.data || [],
      recentInteractions: interactionsResult.data || [],
      contacts: contactsResult.data || [],
      openTickets: ticketsResult.data || [],
      opportunities: opportunitiesResult.data || [],
      renewalOpportunity,
      supportTier: supportTierResult.data?.tier || null,
      metrics,
      championLeft,
    };
  } catch (error) {
    console.error('Error fetching account detail:', error);
    return null;
  }
}

/**
 * Get portfolio overview stats (Total ARR, Avg Health Score, Churn Risk)
 * Optionally filter by CSM
 */
export async function getPortfolioOverviewStats(
  csmName?: string | null
): Promise<PortfolioOverviewStats> {
  const demoDate = getDemoDateString();
  const startOfDay = `${demoDate}T00:00:00`;
  const endOfDay = `${demoDate}T23:59:59`;

  try {
    // Get all accounts (with optional CSM filter)
    let accountsQuery = supabase.from('accounts').select('sf_account_id, arr, csm_name');

    if (csmName) {
      accountsQuery = accountsQuery.eq('csm_name', csmName);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError) throw accountsError;
    if (!accounts || accounts.length === 0) {
      return {
        totalARR: 0,
        accountCount: 0,
        avgHealthScore: null,
        churnRiskPercent: 0,
      };
    }

    const accountIds = accounts.map((a) => a.sf_account_id);

    // Get latest health snapshot for these accounts
    const { data: healthData, error: healthError } = await supabase
      .from('account_health_history')
      .select('sf_account_id, health_status, health_score')
      .in('sf_account_id', accountIds)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (healthError) throw healthError;

    // Calculate stats
    const totalARR = accounts.reduce((sum, acc) => sum + (acc.arr || 0), 0);
    const accountCount = accounts.length;

    // Map account ARR by sf_account_id
    const arrMap = new Map(accounts.map((a) => [a.sf_account_id, a.arr || 0]));

    // Calculate average health score and churn risk
    let healthScoreSum = 0;
    let healthScoreCount = 0;
    let criticalARR = 0;
    let atRiskARR = 0;

    healthData?.forEach((health) => {
      const arr = arrMap.get(health.sf_account_id) || 0;

      if (health.health_score !== null) {
        healthScoreSum += health.health_score;
        healthScoreCount++;
      }

      if (health.health_status === 'Critical') {
        criticalARR += arr;
      } else if (health.health_status === 'At Risk') {
        atRiskARR += arr;
      }
    });

    const avgHealthScore = healthScoreCount > 0 ? healthScoreSum / healthScoreCount : null;
    const churnRiskPercent = totalARR > 0 ? ((criticalARR + atRiskARR) / totalARR) * 100 : 0;

    return {
      totalARR,
      accountCount,
      avgHealthScore,
      churnRiskPercent,
    };
  } catch (error) {
    console.error('Error fetching portfolio overview stats:', error);
    return {
      totalARR: 0,
      accountCount: 0,
      avgHealthScore: null,
      churnRiskPercent: 0,
    };
  }
}

/**
 * Get portfolio health history (average health score over time)
 * Returns daily data points for the specified number of days
 */
export async function getPortfolioHealthHistory(
  days: number,
  csmName?: string | null
): Promise<PortfolioHealthHistoryPoint[]> {
  const demoDate = getDemoDateString();
  const startDate = new Date(new Date(demoDate).getTime() - days * 24 * 60 * 60 * 1000);

  try {
    // Get all accounts (with optional CSM filter)
    let accountsQuery = supabase.from('accounts').select('sf_account_id, csm_name');

    if (csmName) {
      accountsQuery = accountsQuery.eq('csm_name', csmName);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError) throw accountsError;
    if (!accounts || accounts.length === 0) return [];

    const accountIds = accounts.map((a) => a.sf_account_id);

    // Get health history for these accounts
    const { data: healthHistory, error: healthError } = await supabase
      .from('account_health_history')
      .select('sf_account_id, health_score, created_at')
      .in('sf_account_id', accountIds)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (healthError) throw healthError;
    if (!healthHistory || healthHistory.length === 0) return [];

    // Group by date and calculate average health score per day
    const dateMap = new Map<string, { sum: number; count: number }>();

    healthHistory.forEach((record) => {
      if (record.health_score === null || !record.created_at) return;

      const date = record.created_at.split('T')[0]; // Get YYYY-MM-DD
      const existing = dateMap.get(date) || { sum: 0, count: 0 };

      dateMap.set(date, {
        sum: existing.sum + record.health_score,
        count: existing.count + 1,
      });
    });

    // Convert to array and calculate averages
    const result: PortfolioHealthHistoryPoint[] = Array.from(dateMap.entries())
      .map(([date, { sum, count }]) => ({
        date,
        avgHealthScore: count > 0 ? sum / count : null,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  } catch (error) {
    console.error('Error fetching portfolio health history:', error);
    return [];
  }
}

/**
 * Get list of unique CSM names
 */
export async function getCsmList(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('csm_name')
      .not('csm_name', 'is', null)
      .order('csm_name');

    if (error) throw error;

    // Get unique CSM names
    const uniqueCSMs = [...new Set(data?.map((account) => account.csm_name).filter(Boolean))];

    return uniqueCSMs as string[];
  } catch (error) {
    console.error('Error fetching CSM list:', error);
    return [];
  }
}

/**
 * Get renewal forecast data (health breakdown of accounts with renewals in next 90 days)
 */
export async function getRenewalForecast(
  csmName?: string | null
): Promise<RenewalForecastData> {
  const demoDate = getDemoDateString();
  const ninetyDaysFromNow = new Date(demoDate);
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
  const startOfDay = `${demoDate}T00:00:00`;
  const endOfDay = `${demoDate}T23:59:59`;

  try {
    // Get renewal opportunities in next 90 days
    const { data: renewals, error: renewalsError } = await supabase
      .from('opportunities')
      .select('sf_account_id, amount')
      .eq('type', 'Renewal')
      .eq('is_closed', false)
      .lte('close_date', ninetyDaysFromNow.toISOString().split('T')[0]);

    if (renewalsError) throw renewalsError;
    if (!renewals || renewals.length === 0) {
      return {
        healthy: { arr: 0, percent: 0, count: 0 },
        atRisk: { arr: 0, percent: 0, count: 0 },
        critical: { arr: 0, percent: 0, count: 0 },
        total: { arr: 0, count: 0 },
      };
    }

    const renewalAccountIds = renewals.map((r) => r.sf_account_id);

    // Get accounts (with optional CSM filter)
    let accountsQuery = supabase
      .from('accounts')
      .select('sf_account_id, arr, csm_name')
      .in('sf_account_id', renewalAccountIds);

    if (csmName) {
      accountsQuery = accountsQuery.eq('csm_name', csmName);
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError) throw accountsError;
    if (!accounts || accounts.length === 0) {
      return {
        healthy: { arr: 0, percent: 0, count: 0 },
        atRisk: { arr: 0, percent: 0, count: 0 },
        critical: { arr: 0, percent: 0, count: 0 },
        total: { arr: 0, count: 0 },
      };
    }

    const accountIds = accounts.map((a) => a.sf_account_id);

    // Get latest health snapshot for these accounts
    const { data: healthData, error: healthError } = await supabase
      .from('account_health_history')
      .select('sf_account_id, health_status')
      .in('sf_account_id', accountIds)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (healthError) throw healthError;

    // Map account ARR and health status
    const arrMap = new Map(accounts.map((a) => [a.sf_account_id, a.arr || 0]));
    const healthMap = new Map(healthData?.map((h) => [h.sf_account_id, h.health_status]) || []);

    // Calculate breakdown
    let healthyARR = 0;
    let healthyCount = 0;
    let atRiskARR = 0;
    let atRiskCount = 0;
    let criticalARR = 0;
    let criticalCount = 0;

    accounts.forEach((account) => {
      const arr = arrMap.get(account.sf_account_id) || 0;
      const status = healthMap.get(account.sf_account_id);

      if (status === 'Healthy') {
        healthyARR += arr;
        healthyCount++;
      } else if (status === 'At Risk') {
        atRiskARR += arr;
        atRiskCount++;
      } else if (status === 'Critical') {
        criticalARR += arr;
        criticalCount++;
      }
    });

    const totalARR = healthyARR + atRiskARR + criticalARR;
    const totalCount = healthyCount + atRiskCount + criticalCount;

    return {
      healthy: {
        arr: healthyARR,
        percent: totalARR > 0 ? (healthyARR / totalARR) * 100 : 0,
        count: healthyCount,
      },
      atRisk: {
        arr: atRiskARR,
        percent: totalARR > 0 ? (atRiskARR / totalARR) * 100 : 0,
        count: atRiskCount,
      },
      critical: {
        arr: criticalARR,
        percent: totalARR > 0 ? (criticalARR / totalARR) * 100 : 0,
        count: criticalCount,
      },
      total: {
        arr: totalARR,
        count: totalCount,
      },
    };
  } catch (error) {
    console.error('Error fetching renewal forecast:', error);
    return {
      healthy: { arr: 0, percent: 0, count: 0 },
      atRisk: { arr: 0, percent: 0, count: 0 },
      critical: { arr: 0, percent: 0, count: 0 },
      total: { arr: 0, count: 0 },
    };
  }
}
