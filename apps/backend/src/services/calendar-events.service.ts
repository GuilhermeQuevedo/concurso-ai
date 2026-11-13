import { prisma } from '../database/prisma.js';

export interface CalendarSyncOptions {
  syncTasks: boolean;
  syncExams: boolean;
  syncSchedule: boolean;
  syncReminders: boolean;
  defaultTime: string;
}

export interface StudyCalendarEvent {
  uid: string;
  summary: string;
  description: string;
  completed: boolean;
  // Dia inteiro: só a data (AAAA-MM-DD). Com horário: início e fim em UTC.
  allDayDate?: string;
  start?: Date;
  end?: Date;
}

interface ScheduleBlockJson {
  subject?: string;
  type?: string;
  hours?: number;
}

interface ScheduleDayJson {
  date?: string;
  type?: string;
  totalHours?: number;
  completed?: boolean;
  subject?: string;
  blocks?: ScheduleBlockJson[];
}

interface ScheduleJson {
  title?: string;
  weeks?: Array<{ days?: ScheduleDayJson[] }>;
}

const SAO_PAULO_OFFSET_HOURS = 3;
const MINUTES_PER_HOUR = 60;
const DEFAULT_SCHEDULE_MINUTES = 60;

const dayKeyOf = (date: Date): string => date.toISOString().slice(0, 10);
const doneMark = (completed: boolean): string => (completed ? '✅ ' : '');

// Horário de Brasília (sem horário de verão) convertido para o instante UTC.
function saoPauloInstant(dayKey: string, time: string): Date {
  const [hour, minute] = time.split(':').map(Number);
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour + SAO_PAULO_OFFSET_HOURS, minute));
}

function timedRange(dayKey: string, time: string, minutes: number): { start: Date; end: Date } {
  const start = saoPauloInstant(dayKey, time);
  return { start, end: new Date(start.getTime() + minutes * 60_000) };
}

function scheduleEvents(
  schedules: Array<{ id: string; schedule: unknown }>,
  defaultTime: string,
): StudyCalendarEvent[] {
  const events: StudyCalendarEvent[] = [];
  for (const row of schedules) {
    const json = (row.schedule ?? {}) as ScheduleJson;
    const title = json.title ?? 'Cronograma de Estudos';
    for (const week of json.weeks ?? []) {
      for (const day of week.days ?? []) {
        if (!day.date || day.type === 'descanso') continue;
        const blocks = day.blocks ?? [];
        const subjects = blocks.length > 0 ? [...new Set(blocks.map((b) => b.subject ?? 'Estudo'))] : [day.subject ?? 'Estudo'];
        const minutes = Math.round((day.totalHours ?? 0) * MINUTES_PER_HOUR) || DEFAULT_SCHEDULE_MINUTES;
        const lines = blocks.map((b) => `• ${b.subject ?? 'Estudo'} (${b.type ?? 'estudo'}, ${b.hours ?? 0}h)`);
        events.push({
          uid: `schedule-${row.id}-${day.date}@engrama.app`,
          summary: `${doneMark(day.completed === true)}[Cronograma] ${subjects.join(' + ')}`,
          description: `${title}\n${lines.join('\n')}`.trim(),
          completed: day.completed === true,
          ...timedRange(day.date, defaultTime, minutes),
        });
      }
    }
  }
  return events;
}

// Tudo o que o aluno vê no calendário do Engrama, num formato único usado pelo feed ICS e pelo Google.
export class CalendarEventsService {
  async build(userId: string, options: CalendarSyncOptions): Promise<StudyCalendarEvent[]> {
    const [tasks, contests, schedules, reminders] = await Promise.all([
      options.syncTasks ? prisma.studyTask.findMany({ where: { userId }, orderBy: { date: 'asc' } }) : [],
      options.syncExams ? prisma.contest.findMany({ where: { userId, examDate: { not: null } } }) : [],
      options.syncSchedule ? prisma.studySchedule.findMany({ where: { userId }, select: { id: true, schedule: true } }) : [],
      options.syncReminders ? prisma.reminder.findMany({ where: { userId, dueDate: { not: null } } }) : [],
    ]);

    const events: StudyCalendarEvent[] = [];

    for (const task of tasks) {
      events.push({
        uid: `task-${task.id}@engrama.app`,
        summary: `${doneMark(task.completed)}[Estudo] ${task.title}`,
        description: `Disciplina: ${task.discipline ?? 'Geral'}\nDuração: ${task.duration} min\nStatus: ${task.completed ? 'Concluída' : 'Pendente'}`,
        completed: task.completed,
        ...timedRange(dayKeyOf(task.date), options.defaultTime, task.duration),
      });
    }

    for (const contest of contests) {
      if (!contest.examDate) continue;
      events.push({
        uid: `contest-exam-${contest.id}@engrama.app`,
        summary: `🎯 Dia da Prova: ${contest.name}`,
        description: `Concurso: ${contest.name}\nCargo: ${contest.role ?? 'Não especificado'}`,
        completed: false,
        allDayDate: dayKeyOf(contest.examDate),
      });
    }

    events.push(...scheduleEvents(schedules, options.defaultTime));

    for (const reminder of reminders) {
      if (!reminder.dueDate) continue;
      events.push({
        uid: `reminder-${reminder.id}@engrama.app`,
        summary: `${doneMark(reminder.done)}🔔 ${reminder.text}`,
        description: 'Lembrete do Engrama',
        completed: reminder.done,
        allDayDate: dayKeyOf(reminder.dueDate),
      });
    }

    return events;
  }
}
