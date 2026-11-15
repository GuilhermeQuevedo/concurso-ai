import type { ScheduleBlock, ScheduleDay, StudySchedule } from '@/features/study-schedule/types';

export interface CalendarScheduleDay {
  scheduleId: string;
  scheduleTitle: string;
  weekIndex: number;
  dayIndex: number;
  day: ScheduleDay;
}

export function scheduleTitle(schedule: StudySchedule): string {
  return schedule.schedule?.title || schedule.contest?.name || 'Cronograma de Estudos';
}

// Dia a dia dos cronogramas salvos, indexado pela data (AAAA-MM-DD). Descanso entra: marca o dia livre.
export function indexScheduleDays(schedules: StudySchedule[]): Map<string, CalendarScheduleDay[]> {
  const map = new Map<string, CalendarScheduleDay[]>();
  for (const schedule of schedules) {
    if (!schedule.id) continue;
    schedule.schedule?.weeks?.forEach((week, weekIndex) => {
      week.days.forEach((day, dayIndex) => {
        const entry = { scheduleId: schedule.id as string, scheduleTitle: scheduleTitle(schedule), weekIndex, dayIndex, day };
        map.set(day.date, [...(map.get(day.date) ?? []), entry]);
      });
    });
  }
  return map;
}

export function blockLabel(block: ScheduleBlock): string {
  if (block.type === 'revisao') return 'Revisão';
  if (block.type === 'questoes') return 'Questões';
  return 'Estudo';
}
