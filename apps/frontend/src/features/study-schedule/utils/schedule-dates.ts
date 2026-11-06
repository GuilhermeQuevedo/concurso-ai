import type { StudySchedule } from '../types';

const DAY_MS = 86400000;

export function daysUntilExam(examDate: string | undefined): number | null {
  if (!examDate) return null;
  const diff = Math.ceil((new Date(`${examDate}T12:00:00Z`).getTime() - Date.now()) / DAY_MS);
  return diff > 0 ? diff : 0;
}

// A API devolve ora camelCase, ora snake_case; centraliza a leitura desses campos.
export const scheduleExamDate = (s: StudySchedule): string => s.examDate || s.exam_date || '';
export const scheduleDailyHours = (s: StudySchedule): number => s.dailyHours || s.daily_hours || 3;
