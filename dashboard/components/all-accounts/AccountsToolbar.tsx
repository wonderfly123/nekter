'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { getCsmList } from '@/lib/supabase/queries';

interface AccountsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  healthStatus: string[];
  onHealthStatusChange: (value: string[]) => void;
  csmFilter: string[];
  onCsmFilterChange: (value: string[]) => void;
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
  csmFilter,
  onCsmFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: AccountsToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [csmList, setCsmList] = useState<string[]>([]);
  const [csmDropdownOpen, setCsmDropdownOpen] = useState(false);
  const csmDropdownRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(localSearch, 300);

  // Fetch CSM list on mount
  useEffect(() => {
    getCsmList().then(setCsmList).catch(console.error);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (csmDropdownRef.current && !csmDropdownRef.current.contains(event.target as Node)) {
        setCsmDropdownOpen(false);
      }
    }

    if (csmDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [csmDropdownOpen]);

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

  // Toggle CSM filter
  const toggleCsmFilter = (csm: string) => {
    if (csmFilter.includes(csm)) {
      onCsmFilterChange(csmFilter.filter((c) => c !== csm));
    } else {
      onCsmFilterChange([...csmFilter, csm]);
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex flex-col gap-4">
        {/* First Row: Search and Sort */}
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

        {/* Second Row: Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Health Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Health:</span>
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

          {/* CSM Filter Dropdown */}
          {csmList.length > 0 && (
            <div className="relative" ref={csmDropdownRef}>
              <button
                onClick={() => setCsmDropdownOpen(!csmDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  csmFilter.length > 0
                    ? 'border-2 border-orange-500 bg-orange-50'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={csmFilter.length > 0 ? 'text-orange-700 font-medium' : 'text-gray-700'}>
                  CSM {csmFilter.length > 0 && `(${csmFilter.length})`}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    csmDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {csmDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  <div className="p-2">
                    {csmList.map((csm) => (
                      <label
                        key={csm}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={csmFilter.includes(csm)}
                          onChange={() => toggleCsmFilter(csm)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{csm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
