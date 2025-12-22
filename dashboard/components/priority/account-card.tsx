'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { HealthBadge } from '@/components/shared/health-badge';
import { TrendIndicator } from '@/components/shared/trend-indicator';
import { formatCompactCurrency } from '@/lib/utils/formatters';
import { formatDaysAgo } from '@/lib/utils/date-utils';
import { AlertTriangle, Users, Clock, HeartPulse } from 'lucide-react';
import type { PriorityAccount } from '@/lib/supabase/types';

interface AccountCardProps {
  account: PriorityAccount;
}

export function AccountCard({ account }: AccountCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion when clicking name
  };

  return (
    <Card
      className={`transition-all cursor-pointer border ${
        isExpanded
          ? 'border-amber-500 shadow-xl'
          : 'border-gray-200 hover:border-amber-500 hover:shadow-lg'
      }`}
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Compact View - Always Visible */}
        <div>
          {/* Line 1: Health Badge, Company Name, ARR, CSM */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <HealthBadge status={account.health.health_status} size="sm" />
              <Link
                href={`/account/${account.sf_account_id}`}
                onClick={handleNameClick}
                className="text-lg font-semibold text-gray-900 hover:text-amber-600 transition-colors truncate"
              >
                {account.name}
              </Link>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatCompactCurrency(account.arr)}
                </div>
                <div className="text-xs text-gray-500">ARR</div>
              </div>
              {account.csm_name && (
                <div className="text-sm text-gray-600">{account.csm_name}</div>
              )}
            </div>
          </div>

          {/* Line 2: Health Score, Trend, Last Interaction */}
          <div className="flex items-center gap-6 mb-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Health:</span>
              <span className="font-semibold text-gray-900">
                {account.health.avg_sentiment !== null
                  ? Math.round(account.health.avg_sentiment)
                  : 'N/A'}
              </span>
              <TrendIndicator trend={account.health.trend} showText={true} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Last Interaction:</span>
              <span className="font-medium text-gray-900">
                {account.health.days_since_activity !== null
                  ? formatDaysAgo(account.health.days_since_activity)
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Line 3: Top Signals */}
          {account.topSignals.length > 0 && (
            <div className="space-y-1.5">
              {account.topSignals.map((signal, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expanded Details - Shown on Click */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Health Status */}
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Health Status
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-4xl font-bold text-gray-900">
                    {account.health.avg_sentiment !== null
                      ? Math.round(account.health.avg_sentiment)
                      : 'N/A'}
                  </div>
                  <TrendIndicator trend={account.health.trend} showText={true} />
                </div>
                <div className="text-sm text-gray-600">
                  Last contact:{' '}
                  {account.health.days_since_activity !== null
                    ? `${account.health.days_since_activity} days ago`
                    : 'N/A'}
                </div>
              </div>

              {/* Risk Signals */}
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Risk Signals
                </div>
                <div className="space-y-2">
                  {account.health.churn_signals !== null &&
                    account.health.churn_signals > 0 && (
                      <div className="flex items-center gap-2 text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{account.health.churn_signals} Churn Signals</span>
                      </div>
                    )}
                  {account.health.days_since_activity !== null &&
                    account.health.days_since_activity > 30 && (
                      <div className="flex items-center gap-2 text-sm bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>No contact in {account.health.days_since_activity} days</span>
                      </div>
                    )}
                  {account.health.avg_sentiment !== null &&
                    account.health.avg_sentiment < 50 && (
                      <div className="flex items-center gap-2 text-sm bg-orange-50 text-orange-700 px-3 py-2 rounded-lg">
                        <HeartPulse className="w-4 h-4" />
                        <span>Low sentiment ({Math.round(account.health.avg_sentiment)})</span>
                      </div>
                    )}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Recent Activity
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Support tickets</span>
                    <span className="font-medium text-gray-900">
                      {account.health.open_ticket_count || 0} open
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg sentiment</span>
                    <span className="font-medium text-gray-900">
                      {account.health.avg_sentiment !== null
                        ? `${Math.round(account.health.avg_sentiment)}/100`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interactions</span>
                    <span className="font-medium text-gray-900">
                      {account.health.interaction_count || 0} (30d)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last activity</span>
                    <span className="font-medium text-gray-900">
                      {account.health.days_since_activity !== null
                        ? formatDaysAgo(account.health.days_since_activity)
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
