'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { PortfolioHealthHistoryPoint } from '@/lib/supabase/types';

interface HealthScoreChartProps {
  data90d: PortfolioHealthHistoryPoint[];
  data30d: PortfolioHealthHistoryPoint[];
  data7d: PortfolioHealthHistoryPoint[];
}

type TimePeriod = '90d' | '30d' | '7d';

export function HealthScoreChart({ data90d, data30d, data7d }: HealthScoreChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('90d');

  const getData = () => {
    switch (timePeriod) {
      case '90d':
        return data90d;
      case '30d':
        return data30d;
      case '7d':
        return data7d;
      default:
        return data90d;
    }
  };

  const chartData = getData()
    .filter((point) => point.avgHealthScore !== null)
    .map((point) => ({
      date: parseISO(point.date),
      score: point.avgHealthScore!,
    }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Health Score Distribution
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTimePeriod('90d')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              timePeriod === '90d'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            90D
          </button>
          <button
            onClick={() => setTimePeriod('30d')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              timePeriod === '30d'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => setTimePeriod('7d')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              timePeriod === '7d'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            7D
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No health score data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
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
                        Avg Score: {Math.round(data.score)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
