import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast-store';
import { reminderService } from '@/features/reminders/services/reminder.service';
import { studyScheduleService } from '@/features/study-schedule/services/study-schedule.service';
import { getErrorMessage } from '@/utils/error-message';

import { reminderItems, scheduleItems, taskItems, type CalendarItem } from '../calendar-items';
import type { NewItemInput } from '../components/NewItemDialog';
import { studyTaskService } from '../services/study-task.service';
import { indexScheduleDays } from '../utils-schedule-days';

interface DateRange {
  from: string;
  to: string;
}

// Junta tudo o que o aluno tem no calendário: plano, cronogramas, tarefas próprias e lembretes.
export function useCalendarData(range: DateRange, activeContestId: string | null) {
  const queryClient = useQueryClient();
  const onError = (error: unknown) => toast.error(getErrorMessage(error, 'Não foi possível salvar a alteração.'));

  const tasks = useQuery({ queryKey: ['study-tasks', range.from, range.to], queryFn: () => studyTaskService.list(range.from, range.to) });
  const schedules = useQuery({ queryKey: ['study-schedules'], queryFn: studyScheduleService.listSchedules });
  const reminders = useQuery({ queryKey: ['reminders'], queryFn: reminderService.list });

  const items = useMemo<CalendarItem[]>(() => {
    // Cronograma sem edital vinculado vale para qualquer estudo ativo; senão ele sumiria do calendário.
    const scopedSchedules = (schedules.data ?? []).filter((s) => !activeContestId || !s.contestId || s.contestId === activeContestId);
    const scopedTasks = (tasks.data ?? []).filter((t) => !activeContestId || !t.contestId || t.contestId === activeContestId);
    return [
      ...taskItems(scopedTasks),
      ...scheduleItems(indexScheduleDays(scopedSchedules)),
      ...reminderItems(reminders.data ?? []),
    ];
  }, [tasks.data, schedules.data, reminders.data, activeContestId]);

  const refresh = () =>
    Promise.all(['study-tasks', 'study-schedules', 'reminders', 'contests'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));

  const toggle = useMutation({
    mutationFn: async (item: CalendarItem) => {
      const { source } = item;
      if (source.type === 'task') return studyTaskService.setCompleted(source.task.id, !source.task.completed);
      if (source.type === 'reminder') return reminderService.update(source.reminder.id, { done: !source.reminder.done });
      const { scheduleId, weekIndex, dayIndex } = source.entry;
      return studyScheduleService.toggleDayCompletion(scheduleId, weekIndex, dayIndex);
    },
    onSuccess: refresh,
    onError,
  });

  const remove = useMutation({
    mutationFn: async (item: CalendarItem) => {
      if (item.source.type === 'task') return studyTaskService.remove(item.source.task.id);
      if (item.source.type === 'reminder') return reminderService.remove(item.source.reminder.id);
    },
    onSuccess: refresh,
    onError,
  });

  const create = useMutation({
    mutationFn: async (input: NewItemInput): Promise<void> => {
      if (input.kind === 'tarefa') {
        await studyTaskService.create({ title: input.title, date: input.date, discipline: input.discipline, duration: input.duration });
      } else {
        await reminderService.create({ text: input.title, dueDate: input.date });
      }
    },
    onSuccess: refresh,
    onError,
  });

  return {
    items,
    loading: tasks.isLoading || schedules.isLoading || reminders.isLoading,
    toggle,
    remove,
    create,
  };
}
