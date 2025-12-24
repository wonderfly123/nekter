import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { ApprovedUser } from '@/lib/auth/types';

async function fetchApprovedUsers(): Promise<ApprovedUser[]> {
  const { data, error } = await supabase
    .from('approved_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useApprovedUsers() {
  return useQuery({
    queryKey: ['approved-users'],
    queryFn: fetchApprovedUsers,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
