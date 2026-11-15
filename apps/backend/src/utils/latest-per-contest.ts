interface ScheduleRef {
  contestId: string | null;
}

// Um cronograma por edital (o mais recente); os sem edital contam como um grupo só.
// A lista precisa vir do mais novo para o mais antigo.
export function latestPerContest<T extends ScheduleRef>(schedules: readonly T[]): T[] {
  const seen = new Set<string>();
  return schedules.filter((schedule) => {
    const key = schedule.contestId ?? '__sem_edital__';
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
