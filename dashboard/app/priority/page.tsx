'use client';

import { PageContainer } from '@/components/layout/page-container';
import { FilterCards } from '@/components/priority/filter-cards';
import { AccountList } from '@/components/priority/account-list';
import { StatCardSkeleton, CardSkeleton } from '@/components/shared/loading-skeleton';
import { usePriorityAccounts } from '@/hooks/use-priority-accounts';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useFilterStore } from '@/lib/stores/filter-store';

export default function PriorityPage() {
  const { showRenewalsOnly } = useFilterStore();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: accounts, isLoading: accountsLoading } = usePriorityAccounts(showRenewalsOnly);

  return (
    <PageContainer>
      {/* Filter Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : stats ? (
        <FilterCards stats={stats} />
      ) : null}

      {/* Account List */}
      {accountsLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : accounts ? (
        <AccountList accounts={accounts} />
      ) : null}
    </PageContainer>
  );
}
