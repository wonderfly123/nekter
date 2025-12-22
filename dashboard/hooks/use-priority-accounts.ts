import { useQuery } from '@tanstack/react-query';
import { getPriorityAccounts } from '@/lib/supabase/queries';

export function usePriorityAccounts(includeRenewalsOnly: boolean) {
  return useQuery({
    queryKey: ['priority-accounts', includeRenewalsOnly],
    queryFn: () => getPriorityAccounts(includeRenewalsOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
