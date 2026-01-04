import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addChatMessage } from '@/lib/supabase/queries';

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      content,
      role,
    }: {
      sessionId: string;
      content: string;
      role: 'user' | 'assistant';
    }) => addChatMessage(sessionId, content, role),
    onSuccess: (_, variables) => {
      // Invalidate messages for this session
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', variables.sessionId],
      });
      // Invalidate sessions list to update last_message_at
      queryClient.invalidateQueries({
        queryKey: ['chat-sessions'],
      });
    },
  });
}
