'use client';

import { Sidebar } from './sidebar';
import { AppHeader } from './app-header';
import { useSidebarStore } from '@/lib/stores/sidebar-store';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{
          marginLeft: isCollapsed ? '60px' : '260px',
        }}
      >
        <AppHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
