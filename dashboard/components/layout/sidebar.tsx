'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ShieldAlert, TrendingUp, Users, LucideIcon, Droplet, Sparkles, Home } from 'lucide-react';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { UserMenu } from '@/components/user-menu';
import { useAuth } from '@/lib/auth/use-auth';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

const navItems: NavItem[] = [
  { name: 'Welcome', href: '/welcome', icon: Home },
  { name: 'Portfolio', href: '/portfolio', icon: LayoutDashboard },
  { name: 'Save', href: '/save', icon: ShieldAlert },
  { name: 'Grow', href: '/grow', icon: TrendingUp },
  { name: 'Accounts', href: '/all-accounts', icon: Users },
  { name: 'Barry', href: '/chat', icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, setCollapsed } = useSidebarStore();
  const { user } = useAuth();
  const collapseTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (collapseTimeout.current) {
      clearTimeout(collapseTimeout.current);
      collapseTimeout.current = null;
    }
    setCollapsed(false);
  };

  const handleMouseLeave = () => {
    collapseTimeout.current = setTimeout(() => {
      setCollapsed(true);
    }, 150);
  };

  // Get user name and initials
  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return (user?.email || 'U').charAt(0).toUpperCase();
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'fixed left-0 top-0 h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col transition-[width] duration-200 ease-out',
        isCollapsed ? 'w-[52px]' : 'w-[220px]'
      )}
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-3 py-3 min-h-[56px] flex items-center">
        <div className="flex items-center gap-2.5 pl-0.5">
          <div
            className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-md flex items-center justify-center cursor-pointer transition-transform hover:scale-105 flex-shrink-0"
            onClick={() => router.push('/welcome')}
          >
            <Droplet className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span
            className={cn(
              "text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent whitespace-nowrap overflow-hidden cursor-pointer transition-opacity duration-200",
              isCollapsed ? "opacity-0 w-0" : "opacity-100"
            )}
            onClick={() => router.push('/welcome')}
          >
            nekter.io
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 py-2.5 pl-4 pr-3 text-[13px] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border-l-2 font-medium',
                isActive
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border-amber-500'
                  : 'border-transparent'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className={cn(
                "whitespace-nowrap overflow-hidden transition-opacity duration-200",
                isCollapsed ? "opacity-0 w-0" : "opacity-100"
              )}>
                {item.name}
              </span>
              {item.badge && !isCollapsed && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full font-mono">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-3">
        {isCollapsed ? (
          <div className="pl-0.5">
            <div
              className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center font-medium text-[10px] flex-shrink-0"
              title={fullName || user?.email || 'User'}
            >
              {getInitials()}
            </div>
          </div>
        ) : (
          <UserMenu />
        )}
      </div>
    </aside>
  );
}
