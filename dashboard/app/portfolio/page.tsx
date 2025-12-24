'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';
import { StatsCards } from '@/components/portfolio/stats-cards';
import { HealthScoreChart } from '@/components/portfolio/health-score-chart';
import { RenewalForecast } from '@/components/portfolio/renewal-forecast';
import { CsmFilter } from '@/components/portfolio/csm-filter';
import { StatCardSkeleton } from '@/components/shared/loading-skeleton';
import { usePortfolioStats } from '@/hooks/use-portfolio-stats';
import { usePortfolioHealthHistory } from '@/hooks/use-portfolio-health-history';
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

  // Fetch all data with CSM filter
  const { data: stats, isLoading: statsLoading } = usePortfolioStats(selectedCsm);
  const { data: healthHistory90d, isLoading: history90dLoading } = usePortfolioHealthHistory(90, selectedCsm);
  const { data: healthHistory30d, isLoading: history30dLoading } = usePortfolioHealthHistory(30, selectedCsm);
  const { data: healthHistory7d, isLoading: history7dLoading } = usePortfolioHealthHistory(7, selectedCsm);
  const { data: renewalForecast, isLoading: renewalLoading } = useRenewalForecast(selectedCsm);
  const { data: csmList } = useCsmList();

  const isLoading = statsLoading || history90dLoading || history30dLoading || history7dLoading || renewalLoading;

  return (
    <PageContainer>
      {/* CSM Filter */}
      {csmList && csmList.length > 0 && (
        <CsmFilter
          selectedCsm={selectedCsm}
          onCsmChange={setSelectedCsm}
          csmList={csmList}
        />
      )}

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : stats ? (
        <StatsCards stats={stats} />
      ) : null}

      {/* Charts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-[350px] animate-pulse" />
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-[350px] animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Health Score Chart */}
          {healthHistory90d && healthHistory30d && healthHistory7d && (
            <HealthScoreChart
              data90d={healthHistory90d}
              data30d={healthHistory30d}
              data7d={healthHistory7d}
            />
          )}

          {/* Renewal Forecast */}
          {renewalForecast && <RenewalForecast data={renewalForecast} />}
        </div>
      )}
    </PageContainer>
  );
}
