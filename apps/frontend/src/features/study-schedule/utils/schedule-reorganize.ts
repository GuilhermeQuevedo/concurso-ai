import type { ScheduleDay, ScheduleWeek, StudySchedule } from '../types';
import { scheduleExamDate } from './schedule-dates';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export type ReorganizeOutcome =
  | { status: 'ok'; schedule: StudySchedule; moved: number; merged: number }
  | { status: 'exam_passed' }
  | { status: 'nothing_pending' }
  // Há dias pendentes, mas até a prova só restam dias de descanso (ou datas já ocupadas): nada é descartado, nada muda.
  | { status: 'no_study_days' };

const toTime = (key: string): number => new Date(`${key}T12:00:00Z`).getTime();
const toKey = (time: number): string => new Date(time).toISOString().slice(0, 10);
const weekdayOf = (key: string): number => new Date(toTime(key)).getUTCDay();
const isRest = (day: ScheduleDay): boolean => day.type === 'descanso';

function restWeekdays(days: ScheduleDay[]): Set<number> {
  const byWeekday = new Map<number, { rest: number; total: number }>();
  for (const day of days) {
    const entry = byWeekday.get(weekdayOf(day.date)) ?? { rest: 0, total: 0 };
    entry.total += 1;
    if (isRest(day)) entry.rest += 1;
    byWeekday.set(weekdayOf(day.date), entry);
  }
  const rests = [...byWeekday].filter(([, v]) => v.rest === v.total).map(([weekday]) => weekday);
  return rests.length < 7 ? new Set(rests) : new Set();
}

function mergeInto(target: ScheduleDay, extra: ScheduleDay): ScheduleDay {
  return { ...target, totalHours: target.totalHours + extra.totalHours, blocks: [...target.blocks, ...extra.blocks] };
}

// Datas livres de hoje até a véspera da prova, sem as já ocupadas por dias concluídos (inclusive os adiantados no futuro).
function freeSlots(todayKey: string, examKey: string, occupied: Set<string>): string[] {
  const slots: string[] = [];
  for (let t = toTime(todayKey); t < toTime(examKey); t += DAY_MS) {
    const key = toKey(t);
    if (!occupied.has(key)) slots.push(key);
  }
  return slots;
}

function placeDays(pending: ScheduleDay[], slots: string[], rests: Set<number>) {
  const placed: ScheduleDay[] = [];
  let next = 0;
  for (const slot of slots) {
    if (rests.has(weekdayOf(slot))) {
      placed.push({ date: slot, dayOfWeek: WEEKDAYS[weekdayOf(slot)], type: 'descanso', totalHours: 0, blocks: [] });
    } else if (next < pending.length) {
      placed.push({ ...pending[next], date: slot, dayOfWeek: WEEKDAYS[weekdayOf(slot)] });
      next += 1;
    }
  }
  // O excedente vai para o último dia de estudo: nenhum dia pendente é descartado.
  const last = placed.map(isRest).lastIndexOf(false);
  let merged = 0;
  for (; next < pending.length; next += 1) {
    placed[last] = mergeInto(placed[last], pending[next]);
    merged += 1;
  }
  return { placed, merged };
}

function phaseFor(index: number, total: number): ScheduleWeek['phase'] {
  const ratio = index / Math.max(total, 1);
  if (ratio < 0.5) return 'base';
  return ratio < 0.8 ? 'intensification' : 'revision';
}

function groupIntoWeeks(days: ScheduleDay[]): ScheduleWeek[] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const groups = new Map<string, ScheduleDay[]>();
  for (const day of sorted) {
    const sinceMonday = (weekdayOf(day.date) + 6) % 7;
    const monday = toKey(toTime(day.date) - sinceMonday * DAY_MS);
    groups.set(monday, [...(groups.get(monday) ?? []), day]);
  }
  const total = groups.size;
  return [...groups.values()].map((weekDays, i) => ({
    weekNumber: i + 1,
    phase: phaseFor(i, total),
    days: weekDays,
  }));
}

export function reorganizeSchedule(schedule: StudySchedule, todayKey: string): ReorganizeOutcome {
  const examKey = scheduleExamDate(schedule).slice(0, 10);
  if (!examKey || toTime(examKey) <= toTime(todayKey)) return { status: 'exam_passed' };

  const allDays = schedule.schedule.weeks.flatMap((week) => week.days);
  const completed = allDays.filter((day) => day.completed === true);
  const pending = allDays.filter((day) => day.completed !== true && !isRest(day));
  if (pending.length === 0) return { status: 'nothing_pending' };

  const slots = freeSlots(todayKey, examKey, new Set(completed.map((day) => day.date)));
  const rests = restWeekdays(allDays);
  if (!slots.some((slot) => !rests.has(weekdayOf(slot)))) return { status: 'no_study_days' };

  const { placed, merged } = placeDays(pending, slots, rests);
  const weeks = groupIntoWeeks([...completed, ...placed]);

  return { status: 'ok', schedule: { ...schedule, schedule: { ...schedule.schedule, weeks } }, moved: pending.length, merged };
}
