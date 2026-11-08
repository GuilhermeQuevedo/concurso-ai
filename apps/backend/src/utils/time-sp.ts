// O dia de estudo vira à meia-noite de São Paulo (UTC-3, sem horário de verão desde 2019).
const SP_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDaySP(now: Date = new Date()): Date {
  const local = now.getTime() - SP_OFFSET_MS;
  return new Date(Math.floor(local / DAY_MS) * DAY_MS + SP_OFFSET_MS);
}

export function dayKeySP(now: Date = new Date()): string {
  return new Date(now.getTime() - SP_OFFSET_MS).toISOString().slice(0, 10);
}

// A semana começa na segunda-feira.
export function startOfWeekSP(now: Date = new Date()): Date {
  const dayStart = startOfDaySP(now);
  const weekday = new Date(dayStart.getTime() - SP_OFFSET_MS).getUTCDay();
  const sinceMonday = (weekday + 6) % 7;
  return new Date(dayStart.getTime() - sinceMonday * DAY_MS);
}
