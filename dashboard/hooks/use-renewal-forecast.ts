import { useQuery } from '@tanstack/react-query';
import { getRenewalForecast } from '@/lib/supabase/queries';

export function useRenewalForecast(csmName?: string | null) {
  return useQuery({
    queryKey: ['renewal-forecast', csmName],
    queryFn: () => getRenewalForecast(csmName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
