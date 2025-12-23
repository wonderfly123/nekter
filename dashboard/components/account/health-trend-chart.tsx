'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { AccountHealth } from '@/lib/supabase/types';

interface HealthTrendChartProps {
  healthHistory: AccountHealth[];
}

export function HealthTrendChart({ healthHistory }: HealthTrendChartProps) {
  // Transform data for chart
  const chartData = healthHistory.map((health) => ({
    date: health.created_at ? parseISO(health.created_at) : new Date(),
    score: health.avg_sentiment || 0,
    status: health.health_status,
  }));

  // Custom bar color based on health status
  const getBarColor = (status: string) => {
    switch (status) {
      case 'Critical':
        return '#dc2626'; // red-600
      case 'At Risk':
        return '#f59e0b'; // amber-500
      case 'Healthy':
        return '#10b981'; // green-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        90-Day Health Trend
      </h2>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(date, 'MMM d')}
              stroke="#6b7280"
              fontSize={12}
              tickMargin={8}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#6b7280"
              fontSize={12}
              tickMargin={8}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">
                        {format(data.date, 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        Score: {Math.round(data.score)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Status: {data.status}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="score"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const fill = getBarColor(payload.status);
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    rx={4}
                    ry={4}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
