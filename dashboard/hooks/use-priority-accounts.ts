import { useQuery } from '@tanstack/react-query';
import { getPriorityAccounts } from '@/lib/supabase/queries';

export function usePriorityAccounts(
  includeRenewalsOnly: boolean,
  csmName?: string | null
) {
  return useQuery({
    queryKey: ['priority-accounts', includeRenewalsOnly, csmName],
    queryFn: () => getPriorityAccounts(includeRenewalsOnly, csmName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
