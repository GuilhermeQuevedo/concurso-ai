import { useMutation, useQueryClient } from '@tanstack/react-query';

import { contestService, type ContestStatus } from '../services/contest.service';

export function useSetContestDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      contestService.update(id, { status: (done ? 'DONE' : 'STUDYING') satisfies ContestStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contests'] }),
  });
}
