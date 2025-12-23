import { useQuery } from '@tanstack/react-query';
import { getAccountDetail } from '@/lib/supabase/queries';

export function useAccountDetail(sfAccountId: string) {
  return useQuery({
    queryKey: ['account-detail', sfAccountId],
    queryFn: () => getAccountDetail(sfAccountId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!sfAccountId, // Only run query if sfAccountId is provided
  });
}
