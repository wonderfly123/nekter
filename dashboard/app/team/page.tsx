'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';

export default function TeamPage() {
  return (
    <AuthGuard>
      <PageContainer>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-gray-600">
              The Team Performance page is under construction
            </p>
          </div>
        </div>
      </PageContainer>
    </AuthGuard>
  );
}
