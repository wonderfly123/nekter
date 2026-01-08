'use client';

import { Card } from '@/components/ui/card';
import { formatCompactCurrency, formatNumber } from '@/lib/utils/formatters';
import type { PortfolioStats } from '@/lib/supabase/types';
import { useFilterStore } from '@/lib/stores/filter-store';
import { Flame, AlertTriangle, Calendar, Check } from 'lucide-react';

interface FilterCardsProps {
  stats: PortfolioStats;
}

export function FilterCards({ stats }: FilterCardsProps) {
  const { showRenewalsOnly, setShowRenewalsOnly } = useFilterStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Critical Card */}
      <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 hover:shadow-md transition-shadow">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
              Critical
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
              {formatNumber(stats.criticalCount)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {formatCompactCurrency(stats.criticalARR)} ARR
            </div>
          </div>
        </div>
      </Card>

      {/* At Risk Card */}
      <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20 hover:shadow-md transition-shadow">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
              At Risk
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
              {formatNumber(stats.atRiskCount)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {formatCompactCurrency(stats.atRiskARR)} ARR
            </div>
          </div>
        </div>
      </Card>

      {/* Renewals Card - Clickable */}
      <Card
        className={`border-2 cursor-pointer transition-all ${
          showRenewalsOnly
            ? 'border-amber-500 bg-amber-50/50 shadow-md'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md'
        }`}
        onClick={() => setShowRenewalsOnly(!showRenewalsOnly)}
      >
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                showRenewalsOnly
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Calendar
                className={`w-4 h-4 ${
                  showRenewalsOnly ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400'
                }`}
              />
            </div>
            <div className={`flex-1 text-xs font-medium uppercase tracking-wide ${
              showRenewalsOnly ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400'
            }`}>
              Renewals (90D)
            </div>
            {showRenewalsOnly && (
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
              {formatNumber(stats.renewalsCount)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {formatCompactCurrency(stats.renewalsARR)} ARR
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
