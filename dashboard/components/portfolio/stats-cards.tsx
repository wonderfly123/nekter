'use client';

import type { PortfolioOverviewStats } from '@/lib/supabase/types';
import { formatCompactCurrency } from '@/lib/utils/formatters';
import { DollarSign, Activity, AlertTriangle } from 'lucide-react';

interface StatsCardsProps {
  stats: PortfolioOverviewStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total ARR */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">
              Total ARR
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCompactCurrency(stats.totalARR)}
            </div>
            <div className="text-sm text-gray-500">
              {stats.accountCount} account{stats.accountCount !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Average Health Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">
              Avg Health Score
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.avgHealthScore !== null
                ? Math.round(stats.avgHealthScore)
                : 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              portfolio average
            </div>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
            stats.avgHealthScore !== null && stats.avgHealthScore >= 76
              ? 'bg-green-50'
              : stats.avgHealthScore !== null && stats.avgHealthScore >= 51
              ? 'bg-yellow-50'
              : 'bg-red-50'
          }`}>
            <Activity className={`w-6 h-6 ${
              stats.avgHealthScore !== null && stats.avgHealthScore >= 76
                ? 'text-green-600'
                : stats.avgHealthScore !== null && stats.avgHealthScore >= 51
                ? 'text-yellow-600'
                : 'text-red-600'
            }`} />
          </div>
        </div>
      </div>

      {/* Churn Risk */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">
              Churn Risk
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.churnRiskPercent.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">
              next 90 days
            </div>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
            stats.churnRiskPercent < 10
              ? 'bg-green-50'
              : stats.churnRiskPercent < 25
              ? 'bg-yellow-50'
              : 'bg-red-50'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              stats.churnRiskPercent < 10
                ? 'text-green-600'
                : stats.churnRiskPercent < 25
                ? 'text-yellow-600'
                : 'text-red-600'
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}
