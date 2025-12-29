'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';
import { AnimatedGradientBackground } from '@/components/portfolio/animated-gradient-bg';
import { MetricCards } from '@/components/portfolio/metric-cards';
import { DynamicMetricChart } from '@/components/portfolio/dynamic-metric-chart';
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
      '7d': 7,
      '30d': 30,
      '60d': 60,
      '90d': 90,
      '120d': 120,
      '180d': 180,
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
            <div className="flex flex-col sm:flex-row gap-3">
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

        {/* Renewal Forecast */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[300px] animate-pulse" />
        ) : (
          renewalForecast && <RenewalForecast data={renewalForecast} />
        )}
      </PageContainer>
    </>
  );
}
