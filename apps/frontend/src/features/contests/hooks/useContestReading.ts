import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast-store';
import { documentService } from '@/features/documents/services/document.service';

const POLL_MS = 3000;

// Acompanha a leitura do restante de um documento grande e atualiza o edital quando os tópicos novos chegam.
export function useContestReading(contestId: string) {
  const queryClient = useQueryClient();
  const { data: job } = useQuery({
    queryKey: ['contest-reading', contestId],
    queryFn: () => documentService.getContestJob(contestId),
    refetchInterval: (query) => (query.state.data?.status === 'RUNNING' ? POLL_MS : false),
  });

  const wasRunning = useRef(false);
  useEffect(() => {
    if (!job) return;
    if (job.status === 'RUNNING') {
      wasRunning.current = true;
      return;
    }
    if (!wasRunning.current) return;
    wasRunning.current = false;
    void queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
    void queryClient.invalidateQueries({ queryKey: ['contests'] });
    if (!job.message) return;
    if (job.errorCode === 'REST_FAILED') toast.warning(job.message);
    else toast.success(job.message);
  }, [job, contestId, queryClient]);

  return { readingRest: job?.status === 'RUNNING' && job.partsDone >= 1 };
}
