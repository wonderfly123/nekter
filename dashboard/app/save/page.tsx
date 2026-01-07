'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';
import { AccountList } from '@/components/priority/account-list';
import { CsmFilter } from '@/components/portfolio/csm-filter';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { usePriorityAccounts } from '@/hooks/use-priority-accounts';
import { useCsmList } from '@/hooks/use-csm-list';
import { useFilterStore } from '@/lib/stores/filter-store';
import { ShieldAlert, Calendar, Check } from 'lucide-react';

export default function PriorityPage() {
  return (
    <AuthGuard>
      <PriorityContent />
    </AuthGuard>
  );
}

function PriorityContent() {
  const { showRenewalsOnly, setShowRenewalsOnly, selectedCsm, setSelectedCsm } = useFilterStore();
  const { data: csmList } = useCsmList();
  const { data: accounts, isLoading: accountsLoading } = usePriorityAccounts(
    showRenewalsOnly,
    selectedCsm
  );

  const criticalAccounts = accounts?.filter(acc => acc.health.health_status === 'Critical') || [];
  const atRiskAccounts = accounts?.filter(acc => acc.health.health_status === 'At Risk') || [];

  const criticalMRR = criticalAccounts.reduce((sum, acc) => sum + ((acc.arr || 0) / 12), 0);
  const atRiskMRR = atRiskAccounts.reduce((sum, acc) => sum + ((acc.arr || 0) / 12), 0);

  return (
    <PageContainer>
      {/* Header with Title and CSM Filter */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-[32px] font-bold text-gray-900 mb-2">Save</h1>
            <p className="text-[15px] text-gray-500 font-medium">
              At-risk accounts ordered by priority. Focus here to prevent churn.
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Critical Summary Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-red-200 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-700" />
            </div>
            <div>
              <p className="text-xs text-red-700 font-medium uppercase tracking-wide">Critical</p>
              <p className="text-2xl font-bold text-red-900 leading-none mt-1">
                {accountsLoading ? '...' : criticalAccounts.length}
              </p>
            </div>
          </div>
          <p className="text-xs text-red-600">
            ${(criticalMRR / 1000).toFixed(0)}K MRR at risk
          </p>
        </div>

        {/* At Risk Summary Card */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-orange-700 font-medium uppercase tracking-wide">At Risk</p>
              <p className="text-2xl font-bold text-orange-900 leading-none mt-1">
                {accountsLoading ? '...' : atRiskAccounts.length}
              </p>
            </div>
          </div>
          <p className="text-xs text-orange-600">
            ${(atRiskMRR / 1000).toFixed(0)}K MRR at risk
          </p>
        </div>

        {/* Renewals Filter Card */}
        <div
          className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
            showRenewalsOnly
              ? 'border-amber-500 bg-amber-50/50 shadow-md'
              : 'border-gray-200 bg-white hover:shadow-md'
          }`}
          onClick={() => setShowRenewalsOnly(!showRenewalsOnly)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                showRenewalsOnly ? 'bg-amber-100' : 'bg-gray-100'
              }`}
            >
              <Calendar
                className={`w-4 h-4 ${showRenewalsOnly ? 'text-amber-600' : 'text-gray-600'}`}
              />
            </div>
            <div className="flex-1">
              <p className={`text-xs font-medium uppercase tracking-wide ${
                showRenewalsOnly ? 'text-amber-600' : 'text-gray-600'
              }`}>
                Renewals Only (90D)
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Filter to accounts with upcoming renewals
              </p>
            </div>
            {showRenewalsOnly && (
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!accountsLoading && (!accounts || accounts.length === 0) && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No at-risk accounts</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Great news! No accounts are currently flagged as Critical or At Risk.
          </p>
        </div>
      )}

      {/* Account List */}
      {accountsLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : accounts && accounts.length > 0 ? (
        <AccountList accounts={accounts} />
      ) : null}
    </PageContainer>
  );
}
