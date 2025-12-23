import { useQuery } from '@tanstack/react-query';
import { getPortfolioHealthHistory } from '@/lib/supabase/queries';

export function usePortfolioHealthHistory(days: number, csmName?: string | null) {
  return useQuery({
    queryKey: ['portfolio-health-history', days, csmName],
    queryFn: () => getPortfolioHealthHistory(days, csmName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
