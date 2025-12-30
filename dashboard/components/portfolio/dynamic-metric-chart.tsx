'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { MetricHistoryPoint } from '@/lib/supabase/types';
import { formatCompactCurrency } from '@/lib/utils/formatters';

interface DynamicMetricChartProps {
  data: MetricHistoryPoint[];
  selectedMetric: string;
}

interface MetricDisplayConfig {
  dataKey: keyof MetricHistoryPoint;
  label: string;
  formatter: (value: number) => string;
  domain?: [number | ((dataMin: number) => number), number | ((dataMax: number) => number)];
}

export function DynamicMetricChart({ data, selectedMetric }: DynamicMetricChartProps) {
  const metricConfig: Record<string, MetricDisplayConfig> = {
    arr: {
      dataKey: 'arr',
      label: 'MRR',
      formatter: (value) => formatCompactCurrency(value),
      domain: ['auto', 'auto'] as any,
    },
    health: {
      dataKey: 'avgHealthScore',
      label: 'Health Score',
      formatter: (value) => Math.round(value).toString(),
      domain: [0, 100],
    },
    churn: {
      dataKey: 'churnRiskPercent',
      label: 'Churn Risk (%)',
      formatter: (value) => `${value.toFixed(1)}%`,
      domain: [0, (dataMax: number) => Math.ceil(dataMax * 1.2)],
    },
  };

  const config = metricConfig[selectedMetric] || metricConfig.health;

  const chartData = useMemo(
    () =>
      data
        .filter((point) => point[config.dataKey] !== null)
        .map((point) => {
          let value: number = Number(point[config.dataKey]);
          // Convert ARR to MRR by dividing by 12
          if (config.dataKey === 'arr') {
            value = value / 12;
          }
          return {
            date: parseISO(point.date),
            value: value,
          };
        }),
    [data, config.dataKey]
  );

  // Calculate dot interval based on data length
  const getDotInterval = () => {
    const length = chartData.length;
    if (length <= 7) return 1;      // Show all dots for 7D
    if (length <= 30) return 5;     // Show every 5th dot for 30D
    if (length <= 60) return 10;    // Show every 10th dot for 60D
    if (length <= 90) return 15;    // Show every 15th dot for 90D
    return 20;                       // Show every 20th dot for 120D+
  };

  const dotInterval = getDotInterval();

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
        <div className="text-center py-16">
          <p className="text-gray-600">No data available for selected metric</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
      <div className="text-[13px] text-gray-500 mb-6">
        Track how your selected metric performs over time
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.15)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(date, 'MMM d')}
            stroke="#94a3b8"
            fontSize={12}
            tickMargin={12}
            axisLine={false}
            tickLine={false}
            fontFamily="'DM Sans', sans-serif"
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            domain={config.domain}
            tickFormatter={config.formatter}
            stroke="#94a3b8"
            fontSize={12}
            tickMargin={12}
            axisLine={false}
            tickLine={false}
            fontFamily="'JetBrains Mono', monospace"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-gray-900/95 text-white p-3 rounded-lg shadow-xl border border-amber-500">
                    <div className="text-xs text-gray-300 mb-1">
                      {format(data.date, 'MMM d, yyyy')}
                    </div>
                    <div className="text-sm font-semibold">
                      {config.label}: {config.formatter(data.value)}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#colorGradient)"
            dot={(props: any) => {
              const { index } = props;
              // Only show dots at intervals
              if (index % dotInterval === 0) {
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill="#f59e0b"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }
              return null;
            }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
