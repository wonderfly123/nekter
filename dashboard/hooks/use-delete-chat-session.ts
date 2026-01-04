import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteChatSession } from '@/lib/supabase/queries';
import { useAuth } from '@/lib/auth/use-auth';

export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: deleteChatSession,
    onSuccess: () => {
      // Invalidate chat sessions query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', user?.id] });
    },
  });
}
