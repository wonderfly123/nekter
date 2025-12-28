'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, Building2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NotificationsDropdown } from './NotificationsDropdown';

const pageTitles: Record<string, string> = {
  '/priority': 'Priority Accounts',
  '/portfolio': 'Portfolio Overview',
  '/all-accounts': 'All Accounts',
  '/analytics': 'Analytics',
  '/team': 'Team Performance',
};

interface SearchResult {
  sf_account_id: string;
  name: string;
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle =
    pathname.startsWith('/account/') ? 'Account Detail' : pageTitles[pathname] || 'CS Command Center';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSearchOpen]);

  // Debounced search
  useEffect(() => {
    const searchAccounts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setIsSearchOpen(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(
          `/api/accounts/search?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.accounts || []);
          setIsSearchOpen(true);
        }
      } catch (error) {
        console.error('Error searching accounts:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchAccounts, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAccountClick = (accountId: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
    router.push(`/account/${accountId}`);
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>

          <div className="flex items-center gap-4">
            {/* Search Box */}
            <div className="relative w-[280px]" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />

              {/* Search Results Dropdown */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto">
                      {searchResults.map((account) => (
                        <button
                          key={account.sf_account_id}
                          onClick={() => handleAccountClick(account.sf_account_id)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                        >
                          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {account.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {account.sf_account_id}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No accounts found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <NotificationsDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
