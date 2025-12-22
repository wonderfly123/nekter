'use client';

import { useState, useMemo } from 'react';
import { AccountCard } from './account-card';
import { Pagination } from '@/components/shared/pagination';
import type { PriorityAccount } from '@/lib/supabase/types';

interface AccountListProps {
  accounts: PriorityAccount[];
}

const ITEMS_PER_PAGE = 5;

export function AccountList({ accounts }: AccountListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(accounts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAccounts = useMemo(
    () => accounts.slice(startIndex, endIndex),
    [accounts, startIndex, endIndex]
  );

  // Reset to page 1 when accounts change (e.g., filter applied)
  useMemo(() => {
    setCurrentPage(1);
  }, [accounts.length]);

  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">No accounts found</div>
          <p className="text-gray-500 text-sm">
            No accounts match the current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {paginatedAccounts.map((account) => (
          <AccountCard key={account.sf_account_id} account={account} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={accounts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
