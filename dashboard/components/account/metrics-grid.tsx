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
  Users,
} from 'lucide-react';

interface MetricsGridProps {
  data: AccountDetailData;
}

export function MetricsGrid({ data }: MetricsGridProps) {
  const { currentHealth, contacts } = data;

  const metrics = [
    {
      label: 'Avg Sentiment (30d)',
      value:
        currentHealth.avg_sentiment !== null
          ? Math.round(currentHealth.avg_sentiment)
          : 'N/A',
      icon: HeartPulse,
      color:
        currentHealth.avg_sentiment !== null && currentHealth.avg_sentiment < 50
          ? 'text-red-600'
          : currentHealth.avg_sentiment !== null &&
            currentHealth.avg_sentiment >= 70
          ? 'text-green-600'
          : 'text-yellow-600',
      bgColor:
        currentHealth.avg_sentiment !== null && currentHealth.avg_sentiment < 50
          ? 'bg-red-50'
          : currentHealth.avg_sentiment !== null &&
            currentHealth.avg_sentiment >= 70
          ? 'bg-green-50'
          : 'bg-yellow-50',
    },
    {
      label: 'Interactions (30d)',
      value: currentHealth.interaction_count || 0,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Churn Signals',
      value: currentHealth.churn_signals || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Expansion Signals',
      value: currentHealth.expansion_signals || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Open Tickets',
      value: currentHealth.open_ticket_count || 0,
      icon: Ticket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Last Contact',
      value:
        currentHealth.days_since_activity !== null
          ? formatDaysAgo(currentHealth.days_since_activity)
          : 'N/A',
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      label: 'Contacts',
      value: contacts.length,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Health Metrics
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className={`${metric.bgColor} p-6 rounded-lg border border-gray-200`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${metric.color}`} />
                <div className="text-xs text-gray-600 uppercase tracking-wide">
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
