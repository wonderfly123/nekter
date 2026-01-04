import { useQuery } from '@tanstack/react-query';
import { getChatMessages } from '@/lib/supabase/queries';

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => getChatMessages(sessionId!),
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
