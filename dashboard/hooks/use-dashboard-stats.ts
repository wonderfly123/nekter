import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/lib/supabase/queries';

export function useDashboardStats(csmName?: string | null) {
  return useQuery({
    queryKey: ['dashboard-stats', csmName],
    queryFn: () => getDashboardStats(csmName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
