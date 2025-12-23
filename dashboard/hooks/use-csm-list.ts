import { useQuery } from '@tanstack/react-query';
import { getCsmList } from '@/lib/supabase/queries';

export function useCsmList() {
  return useQuery({
    queryKey: ['csm-list'],
    queryFn: getCsmList,
    staleTime: 10 * 60 * 1000, // 10 minutes - CSM list doesn't change often
  });
}
