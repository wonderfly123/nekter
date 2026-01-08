'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AccountsTable } from '@/components/all-accounts/AccountsTable';
import { AccountsToolbar } from '@/components/all-accounts/AccountsToolbar';
import { Pagination } from '@/components/shared/pagination';
import { useAllAccounts } from '@/hooks/use-all-accounts';

function AllAccountsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL parameters
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [limit] = useState(20); // Fixed at 20 per page
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [healthStatus, setHealthStatus] = useState<string[]>(
    searchParams.get('status') ? searchParams.get('status')!.split(',') : []
  );
  const [csmFilter, setCsmFilter] = useState<string[]>(
    searchParams.get('csm') ? searchParams.get('csm')!.split(',') : []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'health_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'asc'
  );

  // Fetch accounts using React Query
  const { data, isLoading, error } = useAllAccounts({
    page,
    limit,
    search,
    healthStatus,
    csmFilter,
    sortBy,
    sortOrder,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (search) params.set('search', search);
    if (healthStatus.length > 0) params.set('status', healthStatus.join(','));
    if (csmFilter.length > 0) params.set('csm', csmFilter.join(','));
    params.set('sort', sortBy);
    params.set('order', sortOrder);

    router.push(`/all-accounts?${params.toString()}`, { scroll: false });
  }, [page, search, healthStatus, csmFilter, sortBy, sortOrder, router]);

  // Handle search change (reset to page 1)
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Handle health status filter change (reset to page 1)
  const handleHealthStatusChange = useCallback((value: string[]) => {
    setHealthStatus(value);
    setPage(1);
  }, []);

  // Handle CSM filter change (reset to page 1)
  const handleCsmFilterChange = useCallback((value: string[]) => {
    setCsmFilter(value);
    setPage(1);
  }, []);

  // Handle sort change
  const handleSortByChange = useCallback((value: string) => {
    setSortBy(value);
  }, []);

  const handleSortOrderChange = useCallback((value: 'asc' | 'desc') => {
    setSortOrder(value);
  }, []);

  // Handle column header sort
  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-status-error-bg border border-status-error-border rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-status-error-text mb-2">Failed to load accounts</h3>
            <p className="text-status-error-text mb-4">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Accounts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage all customer accounts with health scores, ARR, and signals
          </p>
        </div>

        {/* Toolbar */}
        <AccountsToolbar
          searchQuery={search}
          onSearchChange={handleSearchChange}
          healthStatus={healthStatus}
          onHealthStatusChange={handleHealthStatusChange}
          csmFilter={csmFilter}
          onCsmFilterChange={handleCsmFilterChange}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
        />

        {/* Table */}
        <AccountsTable
          accounts={data?.accounts || []}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        {/* Pagination */}
        {data && data.pagination.total > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={limit}
              totalItems={data.pagination.total}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AllAccountsPage() {
  return (
    <AuthGuard>
      <AllAccountsContent />
    </AuthGuard>
  );
}
