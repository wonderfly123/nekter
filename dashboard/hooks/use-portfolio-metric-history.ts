import { useQuery } from '@tanstack/react-query';
import type { MetricHistoryPoint } from '@/lib/supabase/types';

interface UsePortfolioMetricHistoryParams {
  days: number;
  csmName?: string | null;
}

export function usePortfolioMetricHistory({ days, csmName }: UsePortfolioMetricHistoryParams) {
  return useQuery<MetricHistoryPoint[]>({
    queryKey: ['portfolio-metric-history', days, csmName],
    queryFn: async () => {
      const response = await fetch(
        `/api/portfolio/metric-history?days=${days}${csmName ? `&csm=${encodeURIComponent(csmName)}` : ''}`
      );
      if (!response.ok) throw new Error('Failed to fetch metric history');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
