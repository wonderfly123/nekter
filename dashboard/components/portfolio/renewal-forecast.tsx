'use client';

import type { RenewalForecastData } from '@/lib/supabase/types';
import { formatCompactCurrency } from '@/lib/utils/formatters';

interface RenewalForecastProps {
  data: RenewalForecastData;
}

export function RenewalForecast({ data }: RenewalForecastProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Renewal Forecast
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Next 90 days - {data.total.count} renewal{data.total.count !== 1 ? 's' : ''}
        </p>
      </div>

      {data.total.count === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No upcoming renewals in the next 90 days</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Healthy */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Healthy</span>
              <span className="font-mono font-semibold text-gray-900">
                {formatCompactCurrency(data.healthy.arr)} ({data.healthy.percent.toFixed(0)}%)
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${data.healthy.percent}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.healthy.count} account{data.healthy.count !== 1 ? 's' : ''}
            </div>
          </div>

          {/* At Risk */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">At Risk</span>
              <span className="font-mono font-semibold text-gray-900">
                {formatCompactCurrency(data.atRisk.arr)} ({data.atRisk.percent.toFixed(0)}%)
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${data.atRisk.percent}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.atRisk.count} account{data.atRisk.count !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Critical */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Critical</span>
              <span className="font-mono font-semibold text-gray-900">
                {formatCompactCurrency(data.critical.arr)} ({data.critical.percent.toFixed(0)}%)
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${data.critical.percent}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.critical.count} account{data.critical.count !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Total</span>
              <span className="font-mono font-bold text-gray-900">
                {formatCompactCurrency(data.total.arr)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
