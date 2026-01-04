import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateChatSessionTitle } from '@/lib/supabase/queries';
import { useAuth } from '@/lib/auth/use-auth';
import { ChatSessionWithPreview } from '@/lib/supabase/types';

export function useUpdateChatSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: string; title: string }) =>
      updateChatSessionTitle(sessionId, title),
    // Optimistic update for instant UI feedback
    onMutate: async ({ sessionId, title }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chat-sessions', user?.id] });

      // Snapshot previous value
      const previousSessions = queryClient.getQueryData<ChatSessionWithPreview[]>(['chat-sessions', user?.id]);

      // Optimistically update to the new value
      if (previousSessions) {
        queryClient.setQueryData<ChatSessionWithPreview[]>(
          ['chat-sessions', user?.id],
          previousSessions.map(session =>
            session.id === sessionId ? { ...session, title } : session
          )
        );
      }

      return { previousSessions };
    },
    // On error, roll back to previous value
    onError: (err, variables, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(['chat-sessions', user?.id], context.previousSessions);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', user?.id] });
    },
  });
}
