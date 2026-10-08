export const REVIEW_INTERVALS = [1, 3, 7, 15, 40, 60] as const;

export interface ReviewCheckpoint {
  index: number;
  intervalDays: number;
  scheduledFor: Date;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function buildReviewSchedule(from: Date, intervals: readonly number[] = REVIEW_INTERVALS): ReviewCheckpoint[] {
  const base = startOfDay(from);
  return intervals.map((intervalDays, index) => ({
    index,
    intervalDays,
    scheduledFor: addDays(base, intervalDays),
  }));
}
