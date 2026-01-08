'use client';

import { Building2 } from 'lucide-react';
import { HealthBadge } from '@/components/shared/health-badge';
import { formatCurrency } from '@/lib/utils/formatters';
import { formatDate } from '@/lib/utils/date-utils';
import type { AccountDetailData } from '@/lib/supabase/types';

interface AccountHeaderProps {
  data: AccountDetailData;
}

export function AccountHeader({ data }: AccountHeaderProps) {
  const { account, currentHealth, renewalOpportunity, supportTier, metrics } = data;

  // Calculate MRR from ARR
  const mrr = account.arr ? account.arr / 12 : null;

  // Format company size
  const companySize = account.employee_count
    ? `${account.employee_count.toLocaleString()} employees`
    : 'Unknown';

  return (
    <div className="w-80 min-w-[280px] max-w-[320px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
      {/* Account Icon & Name */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {account.name}
            </h1>
            <div className="mt-2">
              <HealthBadge status={currentHealth.health_status} size="md" />
            </div>
          </div>
        </div>
        {currentHealth.health_score !== null && (
          <div className="text-center py-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {Math.round(currentHealth.health_score)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Health Score
            </div>
          </div>
        )}
      </div>

      {/* About This Account */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          About this account
        </h2>
        <div className="space-y-4">
          {/* CSM Owner */}
          {account.csm_name && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">CSM Owner</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {account.csm_name}
              </div>
            </div>
          )}

          {/* ARR */}
          {account.arr !== null && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">ARR</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(account.arr)}
              </div>
            </div>
          )}

          {/* MRR */}
          {mrr !== null && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">MRR</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(mrr)}
              </div>
            </div>
          )}

          {/* Customer Since */}
          {account.created_at && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Customer Since</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(account.created_at)}
              </div>
            </div>
          )}

          {/* Renewal Date */}
          {renewalOpportunity?.close_date && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Renewal Date</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(renewalOpportunity.close_date)}
              </div>
            </div>
          )}

          {/* Contract Term */}
          {renewalOpportunity && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Contract Term</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {renewalOpportunity.name || 'N/A'}
              </div>
            </div>
          )}

          {/* Industry */}
          {account.industry && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Industry</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {account.industry}
              </div>
            </div>
          )}

          {/* Company Size */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Company Size</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {companySize}
            </div>
          </div>

          {/* Support Tier */}
          {supportTier && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Support Tier</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {supportTier}
              </div>
            </div>
          )}

          {/* Last Activity */}
          {account.last_activity_date && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Last Activity</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(account.last_activity_date)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
