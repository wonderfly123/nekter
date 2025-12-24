import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

interface PendingUser {
  id: string;
  email: string;
  created_at: string;
}

async function fetchPendingUsers(): Promise<PendingUser[]> {
  // This requires Supabase auth admin access
  // For now, we'll return empty array - needs proper implementation
  // In production, this should call a server-side API endpoint
  return [];
}

export function usePendingUsers() {
  return useQuery({
    queryKey: ['pending-users'],
    queryFn: fetchPendingUsers,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
