import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast-store';
import { invalidateAfterContestDeleted } from '@/lib/query-invalidation';
import { studyScheduleService } from '@/features/study-schedule/services/study-schedule.service';
import { getErrorMessage } from '@/utils/error-message';

import type { DeleteContestOptions } from '../components/DeleteContestDialog';
import { STATUS_ORDER, statusOf } from '../components/DisciplineStatus';
import { contestService, type SyllabusItem } from '../services/contest.service';

// Dados e ações da tela de detalhe do edital: o componente só cuida da apresentação.
export function useContestDetail(contestId: string, onDeleted: () => void) {
  const queryClient = useQueryClient();

  const { data: contest, isLoading } = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestService.getById(contestId),
  });
  const { data: schedules = [] } = useQuery({ queryKey: ['study-schedules'], queryFn: studyScheduleService.listSchedules });
  const linkedSchedules = schedules.filter((schedule) => schedule.contestId === contestId);

  const refreshProgress = () =>
    Promise.all(
      [['contest', contestId], ['contests'], ['due-reviews']].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  const deleteContest = useMutation({
    mutationFn: (options: DeleteContestOptions) => contestService.delete(contestId, options),
    onSuccess: ({ deletedDocuments }) => {
      void invalidateAfterContestDeleted(queryClient);
      toast.success(deletedDocuments > 0 ? `Prova apagada, junto com ${deletedDocuments} documento(s).` : 'Prova apagada.');
      onDeleted();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível apagar a prova. Tente novamente.')),
  });

  const toggleTopic = useMutation({
    mutationFn: ({ itemId, studied }: { itemId: string; studied: boolean }) => contestService.setTopicStudied(itemId, studied),
    onSuccess: refreshProgress,
  });

  const completeReview = useMutation({
    mutationFn: ({ reviewId, completed }: { reviewId: string; completed: boolean }) => contestService.completeReview(reviewId, completed),
    onSuccess: refreshProgress,
  });

  const setImportance = useMutation({
    mutationFn: ({ discipline, importance }: { discipline: string; importance: number }) =>
      contestService.setImportance(contestId, discipline, importance),
    onSuccess: refreshProgress,
  });

  // Em andamento primeiro, depois as não iniciadas e por fim as concluídas; dentro de cada grupo vale a prioridade do backend.
  const disciplines = useMemo(() => {
    if (!contest) return [];
    const groups = new Map<string, SyllabusItem[]>();
    for (const item of contest.syllabus) groups.set(item.discipline, [...(groups.get(item.discipline) ?? []), item]);
    return contest.disciplines
      .map((stat) => ({ stat, items: groups.get(stat.discipline) ?? [] }))
      .filter((discipline) => discipline.items.length > 0)
      .map((discipline) => ({ ...discipline, status: statusOf(discipline.stat.studied, discipline.items.length) }))
      .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  }, [contest]);

  return { contest, isLoading, linkedSchedules, disciplines, deleteContest, toggleTopic, completeReview, setImportance };
}
