'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/priority': 'Priority Accounts',
  '/portfolio': 'Portfolio Overview',
  '/all-accounts': 'All Accounts',
  '/analytics': 'Analytics',
  '/team': 'Team Performance',
};

export function AppHeader() {
  const pathname = usePathname();
  const pageTitle =
    pathname.startsWith('/account/') ? 'Account Detail' : pageTitles[pathname] || 'CS Command Center';

  return (
    <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>

          <div className="flex items-center gap-4">
            {/* Search Box */}
            <div className="relative w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Notifications */}
            <button className="relative w-9 h-9 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-4.5 h-4.5 text-gray-600" />
              {/* Badge will be added dynamically when notification system is implemented */}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
