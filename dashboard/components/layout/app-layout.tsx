'use client';

import { Sidebar } from './sidebar';
import { AppHeader } from './app-header';
import { useSidebarStore } from '@/lib/stores/sidebar-store';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);

  return (
    <div className="flex h-screen overflow-hidden w-screen">
      <Sidebar />
      <div
        className="flex flex-col overflow-hidden transition-all duration-300"
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
