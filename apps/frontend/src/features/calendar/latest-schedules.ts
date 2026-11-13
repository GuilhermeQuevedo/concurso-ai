import type { StudySchedule } from '@/features/study-schedule/types';

// Um cronograma por edital (o mais recente); os sem edital contam como um grupo só.
// `schedules` vem do mais novo para o mais antigo, como a API devolve.
export function latestPerStudy(schedules: StudySchedule[]): StudySchedule[] {
  const seen = new Set<string>();
  return schedules.filter((schedule) => {
    const key = schedule.contestId ?? '__sem_edital__';
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
