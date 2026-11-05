import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { contestService, type ContestStatus } from '../services/contest.service';

export function useSetContestDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      contestService.update(id, { status: (done ? 'DONE' : 'STUDYING') satisfies ContestStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contests'] }),
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível atualizar a prova. Tente novamente.')),
  });
}
