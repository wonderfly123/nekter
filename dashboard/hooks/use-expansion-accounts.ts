import { useQuery } from '@tanstack/react-query';
import { getExpansionAccounts } from '@/lib/supabase/queries';

export function useExpansionAccounts(
  includeRenewalsOnly: boolean,
  csmName?: string | null
) {
  return useQuery({
    queryKey: ['expansion-accounts', includeRenewalsOnly, csmName],
    queryFn: () => getExpansionAccounts(includeRenewalsOnly, csmName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
