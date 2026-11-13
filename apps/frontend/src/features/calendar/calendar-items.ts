import type { ReminderDTO } from '@/features/reminders/services/reminder.service';
import { subjectColor } from '@/features/questions/subjectColor';

import type { ScheduleBlock } from '@/features/study-schedule/types';

import type { StudyTask } from './services/study-task.service';
import type { CalendarScheduleDay } from './utils-schedule-days';
import { blockLabel } from './utils-schedule-days';

export type ItemKind = 'cronograma' | 'revisao' | 'tarefa' | 'lembrete';

export const KIND_LABELS: Record<ItemKind, string> = {
  cronograma: 'Cronograma',
  revisao: 'Revisão',
  tarefa: 'Tarefa',
  lembrete: 'Lembrete',
};

export const ALL_KINDS: ItemKind[] = ['cronograma', 'revisao', 'tarefa', 'lembrete'];

export type ItemSource =
  | { type: 'task'; task: StudyTask }
  | { type: 'schedule'; entry: CalendarScheduleDay }
  | { type: 'reminder'; reminder: ReminderDTO };

export interface CalendarItem {
  id: string;
  kind: ItemKind;
  title: string;
  date: string;
  subject: string | null;
  color: string;
  done: boolean;
  detail: string | null;
  source: ItemSource;
}

const REMINDER_COLOR = '#f59e0b';
const NEUTRAL_COLOR = '#64748b';

const colorFor = (subject: string | null): string => (subject ? subjectColor(subject) : NEUTRAL_COLOR);

export function taskItems(tasks: StudyTask[]): CalendarItem[] {
  return tasks
    .filter((task) => task.type !== 'ESSAY')
    .map((task) => ({
      id: `task-${task.id}`,
      kind: task.type === 'REVIEW' ? ('revisao' as const) : ('tarefa' as const),
      title: task.title,
      date: task.date.slice(0, 10),
      subject: task.discipline,
      color: colorFor(task.discipline),
      done: task.completed,
      detail: `${task.duration} min`,
      source: { type: 'task' as const, task },
    }));
}

// Um bloco de estudo do cronograma vira um item; concluir vale para o dia inteiro, como no Cronograma.
export function scheduleItems(byDay: Map<string, CalendarScheduleDay[]>): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const [date, entries] of byDay) {
    for (const entry of entries) {
      if (entry.day.type === 'descanso') continue;
      const blocks: ScheduleBlock[] =
        entry.day.blocks.length > 0
          ? entry.day.blocks
          : [{ order: 1, subject: entry.day.subject ?? 'Estudo', type: 'estudo', hours: entry.day.totalHours, priority: 'normal' }];
      blocks.forEach((block, index) => {
        items.push({
          id: `schedule-${entry.scheduleId}-${entry.weekIndex}-${entry.dayIndex}-${index}`,
          kind: 'cronograma',
          title: block.subject,
          date,
          subject: block.subject,
          color: colorFor(block.subject),
          done: entry.day.completed === true,
          detail: `${blockLabel(block)} · ${block.hours}h · ${entry.scheduleTitle}`,
          source: { type: 'schedule', entry },
        });
      });
    }
  }
  return items;
}

export function reminderItems(reminders: ReminderDTO[]): CalendarItem[] {
  return reminders
    .filter((reminder) => reminder.dueDate)
    .map((reminder) => ({
      id: `reminder-${reminder.id}`,
      kind: 'lembrete' as const,
      title: reminder.text,
      date: (reminder.dueDate as string).slice(0, 10),
      subject: null,
      color: REMINDER_COLOR,
      done: reminder.done,
      detail: null,
      source: { type: 'reminder' as const, reminder },
    }));
}

export interface ItemFilters {
  kinds: Set<ItemKind>;
  hiddenSubjects: Set<string>;
}

export function applyFilters(items: CalendarItem[], filters: ItemFilters): CalendarItem[] {
  return items.filter(
    (item) => filters.kinds.has(item.kind) && !(item.subject && filters.hiddenSubjects.has(item.subject)),
  );
}

export function groupByDay(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  for (const item of items) map.set(item.date, [...(map.get(item.date) ?? []), item]);
  return map;
}
