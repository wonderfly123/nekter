'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/use-auth';
import { PendingApproval } from './pending-approval';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isApproved } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }

    // Check profile completion for approved users
    if (!isLoading && user && isApproved) {
      const hasFirstName = user.user_metadata?.first_name;
      const hasLastName = user.user_metadata?.last_name;
      const hasCompany = user.user_metadata?.company;
      const hasSignupReason = user.user_metadata?.signup_reason;

      // If profile is incomplete, redirect to complete-profile
      if (!hasFirstName || !hasLastName || !hasCompany || !hasSignupReason) {
        router.push('/complete-profile');
      }
    }
  }, [user, isLoading, isApproved, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <div className="text-gray-600 font-medium">Convincing the bouncer you're on the list...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (!isApproved) {
    return <PendingApproval />;
  }

  return <>{children}</>;
}
