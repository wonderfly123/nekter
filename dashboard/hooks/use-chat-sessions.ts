import { useQuery } from '@tanstack/react-query';
import { getChatSessions } from '@/lib/supabase/queries';
import { useAuth } from '@/lib/auth/use-auth';

export function useChatSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chat-sessions', user?.id],
    queryFn: () => getChatSessions(user!.id),
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
