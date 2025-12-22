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
      <Card className="border-2 border-red-200 bg-red-50/50 hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-red-600 uppercase tracking-wide">
                Critical
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-gray-900">
              {formatNumber(stats.criticalCount)}
            </div>
            <div className="text-sm text-gray-600">
              {formatCompactCurrency(stats.criticalARR)} ARR
            </div>
          </div>
        </div>
      </Card>

      {/* At Risk Card */}
      <Card className="border-2 border-yellow-200 bg-yellow-50/50 hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-yellow-600 uppercase tracking-wide">
                At Risk
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-gray-900">
              {formatNumber(stats.atRiskCount)}
            </div>
            <div className="text-sm text-gray-600">
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
            : 'border-gray-200 bg-white hover:shadow-md'
        }`}
        onClick={() => setShowRenewalsOnly(!showRenewalsOnly)}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                showRenewalsOnly
                  ? 'bg-amber-100'
                  : 'bg-gray-100'
              }`}
            >
              <Calendar
                className={`w-5 h-5 ${
                  showRenewalsOnly ? 'text-amber-600' : 'text-gray-600'
                }`}
              />
            </div>
            <div className="flex-1">
              <div
                className={`text-sm font-medium uppercase tracking-wide ${
                  showRenewalsOnly ? 'text-amber-600' : 'text-gray-600'
                }`}
              >
                Renewals (90D)
              </div>
            </div>
            {showRenewalsOnly && (
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-gray-900">
              {formatNumber(stats.renewalsCount)}
            </div>
            <div className="text-sm text-gray-600">
              {formatCompactCurrency(stats.renewalsARR)} ARR
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
