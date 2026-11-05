import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { contestService } from '@/features/contests/services/contest.service';

import {
  DEFAULT_DAY_LIMITS,
  averageDailyHours,
  buildAvailability,
  totalMinutes,
  validateDays,
  type DayLimit,
  type ScheduleAvailability,
  type WizardSubject,
} from './schedule-wizard.model';

export interface WizardSubmitPayload {
  examDate: string;
  dailyHours: number;
  subjects: string[];
  availability: ScheduleAvailability;
  contestName: string | null;
}

const clampLevel = (value: number) => Math.min(5, Math.max(1, Math.round(value) || 3));

export function useScheduleWizard() {
  const [searchParams] = useSearchParams();
  const [contestId, setContestId] = useState(searchParams.get('prova') ?? '');
  const [examDate, setExamDate] = useState('');
  const [subjects, setSubjects] = useState<WizardSubject[]>([]);
  const [days, setDays] = useState<DayLimit[]>(DEFAULT_DAY_LIMITS);
  const [goalHours, setGoalHours] = useState<number | null>(null);
  const [maxSubjects, setMaxSubjects] = useState<number | null>(null);

  const contests = useQuery({ queryKey: ['contests'], queryFn: contestService.list });
  const detail = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestService.getById(contestId),
    enabled: Boolean(contestId),
  });

  useEffect(() => {
    if (!detail.data) return;
    setExamDate(detail.data.examDate ? detail.data.examDate.slice(0, 10) : '');
    setSubjects(
      detail.data.disciplines
        .filter((d) => d.inFocus)
        .map((d) => ({ name: d.discipline, importance: clampLevel(d.importance), difficulty: 3 })),
    );
  }, [detail.data]);

  const capacityHours = useMemo(() => Math.round(totalMinutes(days) / 6) / 10, [days]);
  const weeklyHours = goalHours ?? Math.max(1, Math.round(capacityHours));

  const validate = (): string | null => {
    if (!examDate) return 'Informe a data da prova.';
    if (subjects.length === 0) return 'Adicione pelo menos uma matéria.';
    return validateDays(days);
  };

  const buildPayload = (): WizardSubmitPayload => ({
    examDate,
    dailyHours: averageDailyHours(days),
    subjects: subjects.map((s) => s.name),
    availability: buildAvailability(subjects, days, weeklyHours * 60, maxSubjects ?? undefined),
    contestName: detail.data?.name ?? null,
  });

  return {
    contests: contests.data ?? [],
    isLoadingContests: contests.isLoading,
    isLoadingDetail: detail.isFetching,
    contestId,
    setContestId,
    examDate,
    setExamDate,
    subjects,
    setSubjects,
    days,
    setDays,
    weeklyHours,
    setGoalHours,
    maxSubjects,
    setMaxSubjects,
    validate,
    buildPayload,
  };
}
