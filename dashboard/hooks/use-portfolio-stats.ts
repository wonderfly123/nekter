import { useQuery } from '@tanstack/react-query';
import { getPortfolioOverviewStats } from '@/lib/supabase/queries';

export function usePortfolioStats(csmName?: string | null) {
  return useQuery({
    queryKey: ['portfolio-stats', csmName],
    queryFn: () => getPortfolioOverviewStats(csmName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
