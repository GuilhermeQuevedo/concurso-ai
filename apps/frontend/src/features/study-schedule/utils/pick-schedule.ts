import type { StudySchedule } from '../types';

// Qual cronograma abrir: o do estudo ativo (o mais recente salvo) ou, com "todos os estudos",
// o rascunho em andamento e, na falta dele, o último salvo. `saved` vem do mais novo para o mais antigo.
export function pickScheduleForStudy(
  saved: StudySchedule[],
  draft: StudySchedule | null,
  activeContestId: string | null,
): StudySchedule | null {
  if (!activeContestId) return draft ?? saved[0] ?? null;
  const forStudy = saved.find((s) => s.contestId === activeContestId);
  if (forStudy) return forStudy;
  return draft?.contestId === activeContestId ? draft : null;
}
