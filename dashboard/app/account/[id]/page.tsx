'use client';

import { use } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAccountDetail } from '@/hooks/use-account-detail';
import { AccountHeader } from '@/components/account/account-header';
import { AccountTabs } from '@/components/account/account-tabs';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { CardSkeleton } from '@/components/shared/loading-skeleton';

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <AccountDetailContent id={id} />
    </AuthGuard>
  );
}

function AccountDetailContent({ id }: { id: string }) {
  const { data, isLoading, error } = useAccountDetail(id);

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r border-gray-200 p-6">
          <CardSkeleton />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="w-96 border-l border-gray-200 p-6">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Not Found
          </h2>
          <p className="text-gray-600">
            Unable to load account details. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-gray-50">
      {/* Left Panel: Account Header */}
      <AccountHeader data={data} />

      {/* Center Panel: Tabbed Content */}
      <AccountTabs data={data} />

      {/* Right Panel: Sidebar */}
      <AccountSidebar data={data} />
    </div>
  );
}
