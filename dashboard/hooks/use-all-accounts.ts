import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UseAllAccountsParams {
  page: number;
  limit: number;
  search?: string;
  healthStatus?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AllAccountsResponse {
  accounts: {
    sf_account_id: string;
    name: string;
    health_status: string;
    health_score: number | null;
    arr: number | null;
    renewal_date: string | null;
    last_activity_date: string | null;
    csm_name: string | null;
    churn_signals_count: number;
    expansion_signals_count: number;
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useAllAccounts(params: UseAllAccountsParams) {
  const { page, limit, search, healthStatus, sortBy, sortOrder } = params;
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  return useQuery<AllAccountsResponse>({
    queryKey: ['all-accounts', page, limit, search, healthStatus, sortBy, sortOrder],
    enabled: isAuthenticated, // Only run query when authenticated
    queryFn: async () => {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) searchParams.set('search', search);
      if (healthStatus && healthStatus.length > 0) {
        searchParams.set('status', healthStatus.join(','));
      }
      if (sortBy) searchParams.set('sort', sortBy);
      if (sortOrder) searchParams.set('order', sortOrder);

      const response = await fetch(`/api/accounts/all?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
