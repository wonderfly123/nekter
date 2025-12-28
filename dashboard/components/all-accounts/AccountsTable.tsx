'use client';

import { AccountsTableRow } from './AccountsTableRow';
import { Users } from 'lucide-react';

interface AccountRow {
  sf_account_id: string;
  name: string;
  health_status: string;
  health_score: number | null;
  arr: number | null;
  renewal_date: string | null;
  last_activity_date: string | null;
  churn_signals_count: number;
  expansion_signals_count: number;
}

interface AccountsTableProps {
  accounts: AccountRow[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export function AccountsTable({
  accounts,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
}: AccountsTableProps) {
  // Loading skeleton rows
  const renderLoadingRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <tr key={`loading-${index}`} className="border-b border-gray-100">
        {Array.from({ length: 9 }).map((_, colIndex) => (
          <td key={colIndex} className="py-4 px-6">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ));
  };

  // Empty state
  if (!loading && accounts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
        <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts found</h3>
        <p className="text-gray-600">Try adjusting your search or filters</p>
      </div>
    );
  }

  // Sort icon helper
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Sortable column header
  const SortableHeader = ({ column, label, align = 'left' }: { column: string; label: string; align?: 'left' | 'center' | 'right' }) => {
    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

    return (
      <th
        className={`text-gray-600 text-xs uppercase font-semibold px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${alignClass}`}
        onClick={() => onSort?.(column)}
      >
        <div className={`flex items-center gap-2 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
          <span>{label}</span>
          <SortIcon column={column} />
        </div>
      </th>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <SortableHeader column="name" label="Account Name" />
              <SortableHeader column="arr" label="ARR" align="right" />
              <SortableHeader column="health_status" label="Status" />
              <SortableHeader column="health_score" label="Health Score" />
              <SortableHeader column="churn_signals_count" label="Churn (90D)" align="center" />
              <SortableHeader column="expansion_signals_count" label="Expansion (90D)" align="center" />
              <SortableHeader column="last_activity_date" label="Last Activity" />
              <SortableHeader column="renewal_date" label="Renewal Date" />
              <th className="text-gray-600 text-xs uppercase font-semibold px-6 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? renderLoadingRows()
              : accounts.map((account) => (
                  <AccountsTableRow key={account.sf_account_id} account={account} />
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
