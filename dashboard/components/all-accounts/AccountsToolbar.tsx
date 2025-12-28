'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface AccountsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  healthStatus: string[];
  onHealthStatusChange: (value: string[]) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export function AccountsToolbar({
  searchQuery,
  onSearchChange,
  healthStatus,
  onHealthStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: AccountsToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  // Update parent when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setLocalSearch('');
  };

  // Toggle health status filter
  const toggleHealthStatus = (status: string) => {
    if (healthStatus.includes(status)) {
      onHealthStatusChange(healthStatus.filter((s) => s !== status));
    } else {
      onHealthStatusChange([...healthStatus, status]);
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Box (Left, flex-1) */}
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={localSearch}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {localSearch && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Health Status Filter (Middle) */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex gap-2">
            <button
              onClick={() => toggleHealthStatus('Healthy')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                healthStatus.includes('Healthy')
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Healthy
            </button>
            <button
              onClick={() => toggleHealthStatus('At Risk')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                healthStatus.includes('At Risk')
                  ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              At Risk
            </button>
            <button
              onClick={() => toggleHealthStatus('Critical')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                healthStatus.includes('Critical')
                  ? 'bg-red-100 text-red-700 border-2 border-red-500'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Critical
            </button>
          </div>
        </div>

        {/* Sort Dropdown (Right) */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          >
            <option value="name">Account Name</option>
            <option value="health_score">Health Score</option>
            <option value="arr">ARR</option>
            <option value="renewal_date">Renewal Date</option>
            <option value="csm_name">CSM</option>
            <option value="last_activity_date">Last Activity</option>
            <option value="churn_signals_count">Churn Signals</option>
            <option value="expansion_signals_count">Expansion Signals</option>
          </select>
          <button
            onClick={toggleSortOrder}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
          >
            <ArrowUpDown
              className={`w-5 h-5 text-gray-600 transition-transform ${
                sortOrder === 'desc' ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
