import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { MetricHistoryPoint } from '@/lib/supabase/types';

interface UsePortfolioMetricHistoryParams {
  days: number;
  csmName?: string | null;
}

export function usePortfolioMetricHistory({ days, csmName }: UsePortfolioMetricHistoryParams) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  return useQuery<MetricHistoryPoint[]>({
    queryKey: ['portfolio-metric-history', days, csmName],
    enabled: isAuthenticated, // Only run query when authenticated
    queryFn: async () => {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `/api/portfolio/metric-history?days=${days}${csmName ? `&csm=${encodeURIComponent(csmName)}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch metric history');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
