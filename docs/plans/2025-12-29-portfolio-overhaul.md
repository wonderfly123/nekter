# Portfolio Page Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform portfolio page into an interactive analytics dashboard with clickable metric cards, dynamic time-series graph, and enhanced visual design matching nekter-portfolio.html reference.

**Architecture:** Replace static 3-card layout with 4 interactive metric cards that control a single unified graph. Add time range filtering, gradient background animation, and restyle existing components to match new design system. Reuse existing Recharts infrastructure and Supabase queries where possible.

**Tech Stack:** Next.js 16, React 19, Recharts 3.6, TypeScript, Tailwind CSS 4, Supabase, React Query

---

## Task 1: Add JetBrains Mono Font

**Files:**
- Modify: `dashboard/app/layout.tsx:1-50`

**Step 1: Import JetBrains Mono font**

Add font import after existing DM Sans import:

```typescript
import { DM_Sans, JetBrains_Mono } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '600', '700'],
});
```

**Step 2: Add font variable to body className**

Update body element:

```typescript
<body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
```

**Step 3: Verify font loads in browser**

Run: `npm run dev` and open http://localhost:3000
Expected: No console errors, page loads normally

**Step 4: Commit**

```bash
git add dashboard/app/layout.tsx
git commit -m "feat: add JetBrains Mono font for metrics display"
```

---

## Task 2: Create Gradient Background Component

**Files:**
- Create: `dashboard/components/portfolio/animated-gradient-bg.tsx`

**Step 1: Create gradient background component**

```typescript
'use client';

import { useEffect, useRef } from 'react';

export function AnimatedGradientBackground() {
  const gradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!gradientRef.current) return;
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      gradientRef.current.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={gradientRef}
      className="fixed inset-0 -z-10 transition-transform duration-300 ease-out"
      style={{
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(245, 158, 11, 0.02) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(245, 158, 11, 0.02) 0%, transparent 50%)
        `,
        animation: 'pulse 8s ease-in-out infinite alternate',
      }}
    />
  );
}
```

**Step 2: Add pulse animation to global CSS**

Modify: `dashboard/app/globals.css`

Add at end of file:

```css
@keyframes pulse {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}
```

**Step 3: Test gradient renders**

Import and add to portfolio page temporarily:
```typescript
import { AnimatedGradientBackground } from '@/components/portfolio/animated-gradient-bg';

// In component:
<AnimatedGradientBackground />
```

Run: `npm run dev`
Expected: Subtle animated gradient visible on hover

**Step 4: Commit**

```bash
git add dashboard/components/portfolio/animated-gradient-bg.tsx dashboard/app/globals.css
git commit -m "feat: add animated gradient background for portfolio"
```

---

## Task 3: Update Portfolio Stats Types and Add GRR

**Files:**
- Modify: `dashboard/lib/supabase/types.ts:222-227`
- Modify: `dashboard/lib/supabase/queries.ts:422-500`

**Step 1: Add GRR to PortfolioOverviewStats interface**

```typescript
export interface PortfolioOverviewStats {
  totalARR: number;
  accountCount: number;
  avgHealthScore: number | null;
  churnRiskPercent: number;
  grr: number; // Gross Revenue Retention percentage
}
```

**Step 2: Calculate GRR in getPortfolioOverviewStats**

In the return statement of `getPortfolioOverviewStats`, add GRR calculation:

```typescript
// After churnRiskPercent calculation, add:
// For demo purposes, calculate GRR as 100 - churnRiskPercent/2
// In production, this would be actual retention calculation
const grr = Math.max(85, Math.min(100, 100 - (churnRiskPercent / 2)));

return {
  totalARR: totalARR,
  accountCount: accounts.length,
  avgHealthScore: avgHealthScore,
  churnRiskPercent: churnRiskPercent,
  grr: grr,
};
```

**Step 3: Test type changes compile**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add dashboard/lib/supabase/types.ts dashboard/lib/supabase/queries.ts
git commit -m "feat: add GRR metric to portfolio stats"
```

---

## Task 4: Create Metric Card Component with Tooltips

**Files:**
- Create: `dashboard/components/portfolio/metric-cards.tsx`

**Step 1: Create metric cards component**

```typescript
'use client';

import type { PortfolioOverviewStats } from '@/lib/supabase/types';
import { formatCompactCurrency } from '@/lib/utils/formatters';
import { useState } from 'react';

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
      label: 'Total ARR',
      value: formatCompactCurrency(stats.totalARR),
      tooltip: 'Annual Recurring Revenue (ARR) is the total value of all recurring subscription revenue normalized to a one-year period. This metric shows the predictable revenue your business can expect annually.',
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
      tooltip: 'Churn Risk represents the percentage of ARR at risk of not renewing in the next 90 days. This is calculated based on health scores, engagement patterns, and renewal signals.',
    },
    {
      id: 'grr',
      label: 'GRR',
      value: `${stats.grr.toFixed(1)}%`,
      tooltip: 'Gross Revenue Retention (GRR) measures the percentage of recurring revenue retained from existing customers, excluding expansion. A GRR above 90% is considered excellent for SaaS businesses.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric) => (
        <button
          key={metric.id}
          onClick={() => onMetricSelect(metric.id)}
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
```

**Step 2: Verify component renders without errors**

Temporarily add to portfolio page with mock data

Run: `npm run dev`
Expected: 4 cards render, tooltips appear on hover

**Step 3: Commit**

```bash
git add dashboard/components/portfolio/metric-cards.tsx
git commit -m "feat: create clickable metric cards with tooltips"
```

---

## Task 5: Create Time Range Filter Component

**Files:**
- Create: `dashboard/components/portfolio/time-range-filter.tsx`

**Step 1: Create time range filter component**

```typescript
'use client';

interface TimeRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        px-4 py-2.5 pr-10 border border-gray-200 rounded-lg
        bg-white text-sm font-medium text-gray-900
        cursor-pointer appearance-none
        transition-all duration-200
        hover:border-amber-500
        focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10
        min-w-[140px]
      "
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
      }}
    >
      <option value="7d">Last 7 days</option>
      <option value="24h">Last 24 hours</option>
      <option value="14d">Last 14 days</option>
      <option value="30d">Last 30 days</option>
      <option value="90d">Last 90 days</option>
      <option value="month">This month</option>
    </select>
  );
}
```

**Step 2: Test filter renders correctly**

Add to portfolio page temporarily

Run: `npm run dev`
Expected: Dropdown renders with custom arrow, hover effects work

**Step 3: Commit**

```bash
git add dashboard/components/portfolio/time-range-filter.tsx
git commit -m "feat: create time range filter component"
```

---

## Task 6: Update Portfolio Types for Multi-Metric History

**Files:**
- Modify: `dashboard/lib/supabase/types.ts:229-232`
- Modify: `dashboard/lib/supabase/queries.ts` (add new function)

**Step 1: Create MetricHistoryPoint type**

```typescript
export interface MetricHistoryPoint {
  date: string; // ISO date string
  arr: number | null;
  avgHealthScore: number | null;
  churnRiskPercent: number | null;
  grr: number | null;
}
```

**Step 2: Create getPortfolioMetricHistory function**

Add new function to queries.ts:

```typescript
export async function getPortfolioMetricHistory(
  days: number,
  csmName?: string | null
): Promise<MetricHistoryPoint[]> {
  const demoDate = getDemoDateObject();
  const startDate = new Date(demoDate);
  startDate.setDate(startDate.getDate() - days);

  const result: MetricHistoryPoint[] = [];

  // Generate data points for each day
  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Fetch stats for this specific date
    // For demo, we'll use current stats with slight variation
    const stats = await getPortfolioOverviewStats(csmName);

    // Add slight random variation for demo purposes
    const variation = 1 + (Math.random() - 0.5) * 0.05; // ±5% variation

    result.push({
      date: dateStr,
      arr: stats.totalARR * variation,
      avgHealthScore: stats.avgHealthScore,
      churnRiskPercent: stats.churnRiskPercent * variation,
      grr: stats.grr * variation,
    });
  }

  return result;
}
```

**Step 3: Test function compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add dashboard/lib/supabase/types.ts dashboard/lib/supabase/queries.ts
git commit -m "feat: add multi-metric history query function"
```

---

## Task 7: Create Dynamic Metric Chart Component

**Files:**
- Create: `dashboard/components/portfolio/dynamic-metric-chart.tsx`
- Create: `dashboard/hooks/use-portfolio-metric-history.ts`

**Step 1: Create React Query hook for metric history**

```typescript
import { useQuery } from '@tanstack/react-query';
import type { MetricHistoryPoint } from '@/lib/supabase/types';

interface UsePortfolioMetricHistoryParams {
  days: number;
  csmName?: string | null;
}

export function usePortfolioMetricHistory({ days, csmName }: UsePortfolioMetricHistoryParams) {
  return useQuery<MetricHistoryPoint[]>({
    queryKey: ['portfolio-metric-history', days, csmName],
    queryFn: async () => {
      const response = await fetch(
        `/api/portfolio/metric-history?days=${days}${csmName ? `&csm=${encodeURIComponent(csmName)}` : ''}`
      );
      if (!response.ok) throw new Error('Failed to fetch metric history');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Step 2: Create API route for metric history**

Create: `dashboard/app/api/portfolio/metric-history/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPortfolioMetricHistory } from '@/lib/supabase/queries';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function verifyAuth(authHeader: string | null) {
  if (!authHeader) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await verifyAuth(authHeader);

    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const csm = searchParams.get('csm') || null;

    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Invalid days parameter' },
        { status: 400 }
      );
    }

    const data = await getPortfolioMetricHistory(days, csm);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/portfolio/metric-history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Step 3: Create dynamic metric chart component**

```typescript
'use client';

import { useMemo } from 'react';
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
  domain?: [number, number] | [(dataMin: number) => number, (dataMax: number) => number];
}

export function DynamicMetricChart({ data, selectedMetric }: DynamicMetricChartProps) {
  const metricConfig: Record<string, MetricDisplayConfig> = {
    arr: {
      dataKey: 'arr',
      label: 'ARR ($M)',
      formatter: (value) => formatCompactCurrency(value),
      domain: [(dataMin: number) => Math.floor(dataMin * 0.95), (dataMax: number) => Math.ceil(dataMax * 1.05)],
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
    grr: {
      dataKey: 'grr',
      label: 'GRR (%)',
      formatter: (value) => `${value.toFixed(1)}%`,
      domain: [85, 100],
    },
  };

  const config = metricConfig[selectedMetric] || metricConfig.health;

  const chartData = useMemo(
    () =>
      data
        .filter((point) => point[config.dataKey] !== null)
        .map((point) => ({
          date: parseISO(point.date),
          value: point[config.dataKey]!,
        })),
    [data, config.dataKey]
  );

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
        <LineChart data={chartData}>
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
          />
          <YAxis
            domain={config.domain}
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
          <Line
            type="monotone"
            dataKey="value"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', stroke: '#fff', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            fill="url(#colorGradient)"
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.1)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 4: Test chart renders with mock data**

Run: `npm run dev`
Expected: Chart renders, switches between metrics smoothly

**Step 5: Commit**

```bash
git add dashboard/hooks/use-portfolio-metric-history.ts dashboard/app/api/portfolio/metric-history/route.ts dashboard/components/portfolio/dynamic-metric-chart.tsx
git commit -m "feat: create dynamic metric chart with time series data"
```

---

## Task 8: Create Key Metrics Card Component

**Files:**
- Create: `dashboard/components/portfolio/key-metrics-card.tsx`

**Step 1: Create key metrics card component**

```typescript
'use client';

interface KeyMetric {
  label: string;
  value: string;
  percentage: number;
  color: 'green' | 'amber' | 'red';
}

export function KeyMetricsCard() {
  // Mock data - in production, these would come from actual queries
  const metrics: KeyMetric[] = [
    {
      label: 'NPS Score',
      value: '42',
      percentage: 70,
      color: 'green',
    },
    {
      label: 'Expansion Rate',
      value: '18%',
      percentage: 18,
      color: 'amber',
    },
    {
      label: 'Response Time',
      value: '2.4h',
      percentage: 88,
      color: 'green',
    },
  ];

  const getColorClasses = (color: 'green' | 'amber' | 'red') => {
    switch (color) {
      case 'green':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-amber-600';
      case 'red':
        return 'bg-gradient-to-r from-red-500 to-red-600';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8">
      <div className="mb-6">
        <h3 className="text-[18px] font-bold text-gray-900">Key Metrics</h3>
      </div>
      <div className="space-y-6">
        {metrics.map((metric, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[15px] text-gray-600 font-semibold">{metric.label}</span>
              <span className="font-mono font-bold text-[15px] text-gray-900">{metric.value}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${getColorClasses(metric.color)}`}
                style={{ width: `${metric.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Test component renders**

Add to portfolio page temporarily

Run: `npm run dev`
Expected: Card renders with progress bars animating

**Step 3: Commit**

```bash
git add dashboard/components/portfolio/key-metrics-card.tsx
git commit -m "feat: create key metrics card component"
```

---

## Task 9: Update Renewal Forecast Styling

**Files:**
- Modify: `dashboard/components/portfolio/renewal-forecast.tsx`

**Step 1: Update styling to match new design**

Replace entire component with updated styling:

```typescript
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
```

**Step 2: Test updated styling**

Run: `npm run dev`
Expected: Renewal forecast matches new design with gradient progress bars

**Step 3: Commit**

```bash
git add dashboard/components/portfolio/renewal-forecast.tsx
git commit -m "feat: update renewal forecast styling to match new design"
```

---

## Task 10: Update Portfolio Page Layout

**Files:**
- Modify: `dashboard/app/portfolio/page.tsx`
- Modify: `dashboard/components/portfolio/csm-filter.tsx` (update styling)

**Step 1: Update CSM filter styling**

```typescript
'use client';

interface CsmFilterProps {
  selectedCsm: string | null;
  onCsmChange: (csm: string | null) => void;
  csmList: string[];
}

export function CsmFilter({ selectedCsm, onCsmChange, csmList }: CsmFilterProps) {
  return (
    <select
      value={selectedCsm || 'all'}
      onChange={(e) => onCsmChange(e.target.value === 'all' ? null : e.target.value)}
      className="
        px-4 py-2.5 pr-10 border border-gray-200 rounded-lg
        bg-white text-sm font-medium text-gray-900
        cursor-pointer appearance-none
        transition-all duration-200
        hover:border-amber-500
        focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10
        min-w-[140px]
      "
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
      }}
    >
      <option value="all">All CSMs</option>
      {csmList.map((csm) => (
        <option key={csm} value={csm}>
          {csm}
        </option>
      ))}
    </select>
  );
}
```

**Step 2: Rewrite portfolio page with new layout**

```typescript
'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';
import { AnimatedGradientBackground } from '@/components/portfolio/animated-gradient-bg';
import { MetricCards } from '@/components/portfolio/metric-cards';
import { DynamicMetricChart } from '@/components/portfolio/dynamic-metric-chart';
import { KeyMetricsCard } from '@/components/portfolio/key-metrics-card';
import { RenewalForecast } from '@/components/portfolio/renewal-forecast';
import { CsmFilter } from '@/components/portfolio/csm-filter';
import { TimeRangeFilter } from '@/components/portfolio/time-range-filter';
import { StatCardSkeleton } from '@/components/shared/loading-skeleton';
import { usePortfolioStats } from '@/hooks/use-portfolio-stats';
import { usePortfolioMetricHistory } from '@/hooks/use-portfolio-metric-history';
import { useRenewalForecast } from '@/hooks/use-renewal-forecast';
import { useCsmList } from '@/hooks/use-csm-list';

export default function PortfolioPage() {
  return (
    <AuthGuard>
      <PortfolioContent />
    </AuthGuard>
  );
}

function PortfolioContent() {
  const [selectedCsm, setSelectedCsm] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('health');
  const [timeRange, setTimeRange] = useState<string>('7d');

  // Convert timeRange to days
  const getDaysFromTimeRange = (range: string): number => {
    const map: Record<string, number> = {
      '24h': 1,
      '7d': 7,
      '14d': 14,
      '30d': 30,
      '90d': 90,
      'month': 30,
    };
    return map[range] || 7;
  };

  const days = getDaysFromTimeRange(timeRange);

  // Fetch all data
  const { data: stats, isLoading: statsLoading } = usePortfolioStats(selectedCsm);
  const { data: metricHistory, isLoading: historyLoading } = usePortfolioMetricHistory({ days, csmName: selectedCsm });
  const { data: renewalForecast, isLoading: renewalLoading } = useRenewalForecast(selectedCsm);
  const { data: csmList } = useCsmList();

  const isLoading = statsLoading || historyLoading || renewalLoading;

  return (
    <>
      <AnimatedGradientBackground />
      <PageContainer>
        {/* Header with Title and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-[32px] font-bold text-gray-900 mb-2">Portfolio Analytics</h1>
              <p className="text-[15px] text-gray-500 font-medium">
                Track key metrics and trends across your customer portfolio
              </p>
            </div>
            <div className="flex gap-3">
              {csmList && csmList.length > 0 && (
                <CsmFilter
                  selectedCsm={selectedCsm}
                  onCsmChange={setSelectedCsm}
                  csmList={csmList}
                />
              )}
              <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : stats ? (
          <MetricCards
            stats={stats}
            selectedMetric={selectedMetric}
            onMetricSelect={setSelectedMetric}
          />
        ) : null}

        {/* Dynamic Chart */}
        {historyLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8 h-[400px] animate-pulse" />
        ) : metricHistory ? (
          <DynamicMetricChart data={metricHistory} selectedMetric={selectedMetric} />
        ) : null}

        {/* Bottom Section - Key Metrics and Renewal Forecast */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[300px] animate-pulse" />
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[300px] animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KeyMetricsCard />
            {renewalForecast && <RenewalForecast data={renewalForecast} />}
          </div>
        )}
      </PageContainer>
    </>
  );
}
```

**Step 3: Delete unused components**

Remove old components that are no longer used:
- `dashboard/components/portfolio/stats-cards.tsx` (replaced by metric-cards)
- `dashboard/components/portfolio/health-score-chart.tsx` (replaced by dynamic-metric-chart)

Run: `rm dashboard/components/portfolio/stats-cards.tsx dashboard/components/portfolio/health-score-chart.tsx`

**Step 4: Test complete page**

Run: `npm run dev`
Expected: Full portfolio page renders with new design, all interactions work

**Step 5: Commit**

```bash
git add dashboard/app/portfolio/page.tsx dashboard/components/portfolio/csm-filter.tsx
git rm dashboard/components/portfolio/stats-cards.tsx dashboard/components/portfolio/health-score-chart.tsx
git commit -m "feat: complete portfolio page overhaul with new layout"
```

---

## Task 11: Add JetBrains Mono Font Class to Tailwind

**Files:**
- Modify: `dashboard/tailwind.config.ts`

**Step 1: Add font-mono mapping**

Update the theme.extend.fontFamily section:

```typescript
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-dm-sans)', ...defaultTheme.fontFamily.sans],
      mono: ['var(--font-jetbrains-mono)', ...defaultTheme.fontFamily.mono],
    },
  },
}
```

**Step 2: Verify font classes work**

Run: `npm run dev`
Expected: Numbers in metric cards and chart use JetBrains Mono font

**Step 3: Commit**

```bash
git add dashboard/tailwind.config.ts
git commit -m "feat: configure JetBrains Mono as monospace font"
```

---

## Task 12: Test Responsive Behavior

**Files:**
- None (testing only)

**Step 1: Test desktop layout**

Run: `npm run dev`
Open: http://localhost:3000/portfolio
Expected: 4 metric cards in row, 2-column bottom section

**Step 2: Test tablet layout**

Resize browser to ~768px width
Expected: 2 metric cards per row, 2-column bottom section

**Step 3: Test mobile layout**

Resize browser to ~640px width
Expected: 1 metric card per column, 1-column bottom section, filters stack vertically

**Step 4: Test interactions**

- Click each metric card → graph updates
- Change time range → graph data updates
- Change CSM filter → all data updates
- Hover tooltips → tooltips appear correctly

Expected: All interactions work smoothly, no console errors

---

## Task 13: Final Testing and Cleanup

**Files:**
- Clean up any unused hooks
- Review: `dashboard/hooks/use-portfolio-health-history.ts` (may be unused now)

**Step 1: Check for unused hooks**

Run: `grep -r "use-portfolio-health-history" dashboard/`
Expected: If no results outside the hook file itself, safe to remove

**Step 2: Remove unused hook if applicable**

```bash
git rm dashboard/hooks/use-portfolio-health-history.ts
```

**Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings

**Step 4: Test production build locally**

Run: `npm run start`
Open: http://localhost:3000/portfolio
Expected: Everything works in production mode

**Step 5: Final commit**

```bash
git add .
git commit -m "chore: remove unused hooks and finalize portfolio overhaul"
```

---

## Completion Checklist

- [ ] JetBrains Mono font added and configured
- [ ] Animated gradient background implemented
- [ ] GRR metric added to portfolio stats
- [ ] 4 clickable metric cards with tooltips working
- [ ] Time range filter component created
- [ ] Multi-metric history query implemented
- [ ] Dynamic chart switches between metrics smoothly
- [ ] Key Metrics card displays with progress bars
- [ ] Renewal Forecast styled to match new design
- [ ] Portfolio page layout completely overhauled
- [ ] CSM and time range filters styled consistently
- [ ] Old unused components removed
- [ ] Responsive design tested (desktop, tablet, mobile)
- [ ] All interactions work (click cards, change filters, tooltips)
- [ ] Production build succeeds
- [ ] No console errors or TypeScript warnings

---

## Notes

- **GRR Calculation**: Currently using a demo formula (100 - churnRiskPercent/2). In production, implement actual GRR calculation based on revenue retention data.
- **Key Metrics Data**: NPS, Expansion Rate, and Response Time use mock data. Connect to real data sources when available.
- **Time Range Data**: Currently generating demo data with variation. In production, fetch actual historical snapshots from database.
- **Chart Animation**: Recharts provides smooth transitions when data changes. Test with larger datasets to ensure performance.
- **Accessibility**: Ensure tooltips are keyboard-accessible (add focus styles if needed).
