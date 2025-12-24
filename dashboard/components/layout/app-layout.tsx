'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { AppHeader } from './app-header';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { useAuth } from '@/lib/auth/use-auth';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const { isApproved, isLoading } = useAuth();

  // Public routes that don't need sidebar/header
  const publicRoutes = ['/login', '/reset-password', '/complete-profile'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Hide layout for public routes OR pending users
  if (isPublicRoute || (!isLoading && !isApproved)) {
    return <>{children}</>;
  }

  // Authenticated routes get full layout
  return (
    <div className="flex h-screen overflow-hidden w-screen">
      <Sidebar />
      <div
        className="flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isCollapsed ? '60px' : '260px',
          width: isCollapsed ? 'calc(100vw - 60px)' : 'calc(100vw - 260px)',
        }}
      >
        <AppHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 h-full w-full">{children}</main>
      </div>
    </div>
  );
}
