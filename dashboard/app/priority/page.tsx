'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';
import { FilterCards } from '@/components/priority/filter-cards';
import { AccountList } from '@/components/priority/account-list';
import { CsmFilter } from '@/components/portfolio/csm-filter';
import { StatCardSkeleton, CardSkeleton } from '@/components/shared/loading-skeleton';
import { usePriorityAccounts } from '@/hooks/use-priority-accounts';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useCsmList } from '@/hooks/use-csm-list';
import { useFilterStore } from '@/lib/stores/filter-store';

export default function PriorityPage() {
  return (
    <AuthGuard>
      <PriorityContent />
    </AuthGuard>
  );
}

function PriorityContent() {
  const { showRenewalsOnly, selectedCsm, setSelectedCsm } = useFilterStore();
  const { data: csmList } = useCsmList();
  const { data: stats, isLoading: statsLoading } = useDashboardStats(selectedCsm);
  const { data: accounts, isLoading: accountsLoading } = usePriorityAccounts(
    showRenewalsOnly,
    selectedCsm
  );

  return (
    <PageContainer>
      {/* Header with Title and CSM Filter */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-[32px] font-bold text-gray-900 mb-2">Priority Accounts</h1>
            <p className="text-[15px] text-gray-500 font-medium">
              Accounts ordered by priority algorithm. We recommend creating account plans in this order.
            </p>
          </div>
          {csmList && csmList.length > 0 && (
            <CsmFilter
              selectedCsm={selectedCsm}
              onCsmChange={setSelectedCsm}
              csmList={csmList}
            />
          )}
        </div>
      </div>

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
