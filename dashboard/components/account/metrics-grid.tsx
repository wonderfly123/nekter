'use client';

import { TrendIndicator } from '@/components/shared/trend-indicator';
import { formatDaysAgo } from '@/lib/utils/date-utils';
import type { AccountDetailData } from '@/lib/supabase/types';
import {
  HeartPulse,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Ticket,
  Clock,
} from 'lucide-react';

interface MetricsGridProps {
  data: AccountDetailData;
}

export function MetricsGrid({ data }: MetricsGridProps) {
  const { currentHealth, metrics: calculatedMetrics } = data;

  const metrics = [
    {
      label: 'Avg Sentiment (90d)',
      value:
        calculatedMetrics.avgSentiment !== null
          ? Math.round(calculatedMetrics.avgSentiment)
          : 'N/A',
      icon: HeartPulse,
      color:
        calculatedMetrics.avgSentiment !== null && calculatedMetrics.avgSentiment < 50
          ? 'text-status-error-text'
          : calculatedMetrics.avgSentiment !== null &&
            calculatedMetrics.avgSentiment >= 70
          ? 'text-status-success-text'
          : 'text-status-warning-text',
      bgColor:
        calculatedMetrics.avgSentiment !== null && calculatedMetrics.avgSentiment < 50
          ? 'bg-status-error-bg'
          : calculatedMetrics.avgSentiment !== null &&
            calculatedMetrics.avgSentiment >= 70
          ? 'bg-status-success-bg'
          : 'bg-status-warning-bg',
    },
    {
      label: 'Interactions (90d)',
      value: calculatedMetrics.interactionCount,
      icon: MessageSquare,
      color: 'text-status-info-text',
      bgColor: 'bg-status-info-bg',
    },
    {
      label: 'Churn Signals',
      value: calculatedMetrics.churnSignals,
      icon: AlertTriangle,
      color: 'text-status-error-text',
      bgColor: 'bg-status-error-bg',
    },
    {
      label: 'Expansion Signals',
      value: calculatedMetrics.expansionSignals,
      icon: TrendingUp,
      color: 'text-status-success-text',
      bgColor: 'bg-status-success-bg',
    },
    {
      label: 'Open Tickets',
      value: calculatedMetrics.openTicketCount,
      icon: Ticket,
      color: 'text-status-warning-text',
      bgColor: 'bg-status-warning-bg',
    },
    {
      label: 'Last Contact',
      value:
        calculatedMetrics.daysSinceActivity !== null
          ? formatDaysAgo(calculatedMetrics.daysSinceActivity)
          : 'N/A',
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Health Metrics
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className={`${metric.bgColor} p-6 rounded-lg border border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${metric.color}`} />
                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {metric.label}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className={`text-3xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                {index === 0 && currentHealth.trend && (
                  <TrendIndicator trend={currentHealth.trend} showText={false} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
