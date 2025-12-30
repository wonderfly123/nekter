'use client';

import type { PortfolioOverviewStats } from '@/lib/supabase/types';
import { formatCompactCurrency } from '@/lib/utils/formatters';

interface MetricCardsProps {
  stats: PortfolioOverviewStats;
  selectedMetric: string;
  onMetricSelect: (metric: string) => void;
}

interface MetricConfig {
  id: string;
  label: string;
  value: string;
  tooltip: string;
}

export function MetricCards({ stats, selectedMetric, onMetricSelect }: MetricCardsProps) {
  const metrics: MetricConfig[] = [
    {
      id: 'arr',
      label: 'Total MRR',
      value: formatCompactCurrency(stats.totalARR / 12),
      tooltip: 'Monthly Recurring Revenue (MRR) is the total value of all recurring subscription revenue normalized to a one-month period. This metric shows the predictable revenue your business can expect monthly.',
    },
    {
      id: 'health',
      label: 'Health Score',
      value: stats.avgHealthScore !== null ? Math.round(stats.avgHealthScore).toString() : 'N/A',
      tooltip: 'Customer Health Score is a composite metric (0-100) that measures account engagement, product usage, support interactions, and sentiment. Higher scores indicate healthier, more likely to renew customers.',
    },
    {
      id: 'churn',
      label: 'Churn Risk',
      value: `${stats.churnRiskPercent.toFixed(1)}%`,
      tooltip: 'Churn Risk represents the percentage of MRR at risk of not renewing in the next 90 days. This is calculated based on health scores, engagement patterns, and renewal signals.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {metrics.map((metric) => (
        <button
          key={metric.id}
          onClick={() => onMetricSelect(metric.id)}
          aria-label={`${metric.label}: ${metric.value}${selectedMetric === metric.id ? ' (selected)' : ''}`}
          aria-pressed={selectedMetric === metric.id}
          className={`
            bg-gray-50 border-2 rounded-xl p-6 text-left transition-all duration-300 cursor-pointer
            hover:bg-white hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5
            ${
              selectedMetric === metric.id
                ? 'bg-white border-amber-500 shadow-md'
                : 'border-gray-200'
            }
          `}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[13px] font-semibold text-gray-500 flex-1">
              {metric.label}
            </div>
            <div className="group relative">
              <div className="w-4 h-4 border-[1.5px] border-gray-400 rounded-full flex items-center justify-center text-[10px] text-gray-400 font-bold cursor-help transition-all hover:border-amber-500 hover:text-amber-500 hover:bg-amber-50">
                ?
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] p-3 bg-gray-900 text-white text-[13px] leading-relaxed rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                <div className="font-semibold mb-1">About this metric</div>
                <div className="text-gray-300">{metric.tooltip}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900" />
              </div>
            </div>
          </div>
          <div className="text-[32px] font-bold font-mono text-gray-900 leading-none">
            {metric.value}
          </div>
        </button>
      ))}
    </div>
  );
}
