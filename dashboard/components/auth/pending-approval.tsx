'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { clearApprovalCache } from '@/lib/auth/check-approval';
import { supabase } from '@/lib/supabase/client';

export function PendingApproval() {
  const { user, signOut, refreshAuthState } = useAuth();
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Auto-check every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkApprovalStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkApprovalStatus = async () => {
    setChecking(true);
    try {
      // Clear the cached approval status
      clearApprovalCache();

      // Force refresh the session to get latest app_metadata
      await supabase.auth.refreshSession();

      // Refresh auth state
      if (refreshAuthState) {
        await refreshAuthState();
      }

      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking approval status:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-status-warning-bg">
            <svg
              className="h-6 w-6 text-status-warning-text"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Pending Approval
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your account is pending approval. You'll receive access once an administrator approves your account.
          </p>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.email}</p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={checkApprovalStatus}
              disabled={checking}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? 'Checking...' : 'Check Approval Status'}
            </button>

            {lastChecked && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}

            <button
              onClick={signOut}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Logout
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            Status is automatically checked every 30 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
