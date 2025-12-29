'use client';

import type { RenewalForecastData } from '@/lib/supabase/types';
import { formatCompactCurrency } from '@/lib/utils/formatters';

interface RenewalForecastProps {
  data: RenewalForecastData;
}

export function RenewalForecast({ data }: RenewalForecastProps) {
  const segments = [
    {
      key: 'healthy',
      label: 'Healthy',
      data: data.healthy,
      color: 'green',
      gradient: 'bg-gradient-to-r from-green-500 to-green-600',
    },
    {
      key: 'atRisk',
      label: 'At Risk',
      data: data.atRisk,
      color: 'amber',
      gradient: 'bg-gradient-to-r from-amber-500 to-amber-600',
    },
    {
      key: 'critical',
      label: 'Critical',
      data: data.critical,
      color: 'red',
      gradient: 'bg-gradient-to-r from-red-500 to-red-600',
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8">
      <div className="mb-6">
        <h3 className="text-[18px] font-bold text-gray-900">Renewal Forecast</h3>
      </div>

      {data.total.count === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No upcoming renewals in the next 90 days</p>
        </div>
      ) : (
        <div className="space-y-6">
          {segments.map((segment) => (
            <div key={segment.key} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[15px] text-gray-600 font-semibold">{segment.label}</span>
                <span className="font-mono font-bold text-[15px] text-gray-900">
                  {formatCompactCurrency(segment.data.arr)} ({segment.data.percent.toFixed(0)}%)
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${segment.gradient}`}
                  style={{ width: `${segment.data.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
