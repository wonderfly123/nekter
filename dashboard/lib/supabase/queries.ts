import { supabase } from './client';
import type {
  PriorityAccount,
  PortfolioStats,
  AccountDetailData,
  AccountHealth,
  InteractionInsight,
} from './types';

// Query functions will be implemented in Parts 2 & 3
export async function getPriorityAccounts(
  includeRenewalsOnly: boolean
): Promise<PriorityAccount[]> {
  // TODO: Implement in Part 2
  return [];
}

export async function getDashboardStats(): Promise<PortfolioStats> {
  // TODO: Implement in Part 2
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

export async function getAccountDetail(
  sfAccountId: string
): Promise<AccountDetailData | null> {
  // TODO: Implement in Part 3
  return null;
}
