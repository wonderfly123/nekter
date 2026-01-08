'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';
import { AccountList } from '@/components/priority/account-list';
import { CsmFilter } from '@/components/portfolio/csm-filter';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { useExpansionAccounts } from '@/hooks/use-expansion-accounts';
import { useCsmList } from '@/hooks/use-csm-list';
import { useFilterStore } from '@/lib/stores/filter-store';
import { TrendingUp, Calendar, Check } from 'lucide-react';

export default function GrowPage() {
  return (
    <AuthGuard>
      <GrowContent />
    </AuthGuard>
  );
}

function GrowContent() {
  const { showRenewalsOnly, setShowRenewalsOnly, selectedCsm, setSelectedCsm } = useFilterStore();
  const { data: csmList } = useCsmList();
  const { data: accounts, isLoading: accountsLoading } = useExpansionAccounts(showRenewalsOnly, selectedCsm);

  const totalExpansionMRR = accounts?.reduce((sum, acc) => sum + ((acc.arr || 0) / 12), 0) || 0;

  return (
    <PageContainer>
      {/* Header with Title and CSM Filter */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-[32px] font-bold text-gray-900 dark:text-white mb-2">Grow</h1>
            <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium">
              Accounts with expansion signals detected. Prioritized by ARR potential.
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Expansion Summary Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-green-700 dark:text-green-400 font-medium uppercase tracking-wide">Expansion Opportunities</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300 leading-none mt-1">
                {accountsLoading ? '...' : accounts?.length || 0}
              </p>
            </div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">
            ${(totalExpansionMRR / 1000).toFixed(0)}K MRR with growth potential
          </p>
        </div>

        {/* Renewals Filter Card */}
        <div
          className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
            showRenewalsOnly
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/20 shadow-md'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md'
          }`}
          onClick={() => setShowRenewalsOnly(!showRenewalsOnly)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                showRenewalsOnly ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Calendar
                className={`w-4 h-4 ${showRenewalsOnly ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}
              />
            </div>
            <div className="flex-1">
              <p className={`text-xs font-medium uppercase tracking-wide ${
                showRenewalsOnly ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                Renewals Only (90D)
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No expansion opportunities yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            When our system detects growth signals in customer interactions, they'll appear here.
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
