'use client';

import Link from 'next/link';
import { HealthBadge } from '@/components/shared/health-badge';
import { formatCurrency } from '@/lib/utils/formatters';
import { format } from 'date-fns';
import { formatDaysAgo } from '@/lib/utils/date-utils';
import { ArrowRight } from 'lucide-react';

interface AccountRow {
  sf_account_id: string;
  name: string;
  health_status: string;
  health_score: number | null;
  arr: number | null;
  renewal_date: string | null;
  last_activity_date: string | null;
  churn_signals_count: number;
  expansion_signals_count: number;
}

interface AccountsTableRowProps {
  account: AccountRow;
}

export function AccountsTableRow({ account }: AccountsTableRowProps) {
  // Calculate days since last activity
  let daysSinceActivity: string | null = null;
  if (account.last_activity_date) {
    const today = new Date();
    const lastActivity = new Date(account.last_activity_date);
    const diffTime = today.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    daysSinceActivity = formatDaysAgo(diffDays);
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Get health score color
  const getHealthScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-200';
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
      {/* Account Name */}
      <td className="py-4 px-6">
        <Link
          href={`/account/${account.sf_account_id}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {getInitials(account.name)}
          </div>
          <span className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
            {account.name}
          </span>
        </Link>
      </td>

      {/* Renewal Date */}
      <td className="py-4 px-6 text-sm text-gray-700">
        {account.renewal_date ? format(new Date(account.renewal_date), 'MMM d, yyyy') : '—'}
      </td>

      {/* Status */}
      <td className="py-4 px-6">
        <HealthBadge
          status={account.health_status as 'Healthy' | 'At Risk' | 'Critical'}
          size="sm"
        />
      </td>

      {/* Health Score */}
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900 w-8">
            {account.health_score !== null ? Math.round(account.health_score) : 'N/A'}
          </span>
          {account.health_score !== null && (
            <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
              <div
                className={`h-2 rounded-full transition-all ${getHealthScoreColor(
                  account.health_score
                )}`}
                style={{ width: `${account.health_score}%` }}
              />
            </div>
          )}
        </div>
      </td>

      {/* ARR */}
      <td className="py-4 px-6 text-right">
        <span className="text-sm font-semibold text-gray-900 font-mono">
          {account.arr ? formatCurrency(account.arr) : '—'}
        </span>
      </td>

      {/* Churn Signals */}
      <td className="py-4 px-6 text-center">
        {account.churn_signals_count > 0 ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
            {account.churn_signals_count}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      {/* Expansion Signals */}
      <td className="py-4 px-6 text-center">
        {account.expansion_signals_count > 0 ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
            {account.expansion_signals_count}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      {/* Last Activity */}
      <td className="py-4 px-6 text-sm text-gray-500">
        {daysSinceActivity || '—'}
      </td>

      {/* Actions */}
      <td className="py-4 px-6 text-right">
        <Link
          href={`/account/${account.sf_account_id}`}
          className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
        >
          View
          <ArrowRight className="w-4 h-4" />
        </Link>
      </td>
    </tr>
  );
}
