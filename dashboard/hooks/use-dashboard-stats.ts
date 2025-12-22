import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/lib/supabase/queries';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
