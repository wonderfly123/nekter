'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Zap, Users, BarChart3, LucideIcon } from 'lucide-react';
import { useSidebarStore } from '@/lib/stores/sidebar-store';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

const navItems: NavItem[] = [
  { name: 'Portfolio', href: '/portfolio', icon: LayoutDashboard },
  { name: 'Priority', href: '/priority', icon: Zap }, // badge will be added dynamically in Part 2
  { name: 'All Accounts', href: '/all-accounts', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed, setCollapsed } = useSidebarStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-gray-50 border-r border-gray-200 transition-all duration-300 z-50 flex flex-col',
        isCollapsed ? 'w-[60px]' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className={cn(
        "border-b border-gray-200 p-6 min-h-[88px]",
        isCollapsed ? "flex items-center justify-center" : "flex items-center justify-between"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "flex-col gap-0"
        )}>
          <div
            className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            onClick={toggleCollapsed}
          >
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              nekter.io
            </span>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3.5 px-6 py-3.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors border-l-2 font-medium',
                isActive
                  ? 'bg-amber-50 text-amber-600 border-amber-500'
                  : 'border-transparent',
                isCollapsed && 'justify-center px-0'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full font-mono">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={cn(
        "border-t border-gray-200 p-6",
        isCollapsed && "flex items-center justify-center"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            AH
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-900 truncate">
                Anthony Huni
              </div>
              <div className="text-xs text-gray-500 truncate">CSM Owner</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
