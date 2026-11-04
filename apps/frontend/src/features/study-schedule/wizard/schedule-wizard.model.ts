export type WeekDay = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export const WEEK_DAYS: Array<{ key: WeekDay; label: string }> = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

export interface WizardSubject {
  name: string;
  importance: number;
  difficulty: number;
}

export interface DayLimit {
  day: WeekDay;
  enabled: boolean;
  minMinutes: number;
  maxMinutes: number;
}

export interface ScheduleAvailability {
  subjects: WizardSubject[];
  days: Array<{ day: WeekDay; minMinutes: number; maxMinutes: number }>;
  weeklyGoalMinutes?: number;
  maxSubjectsPerDay?: number;
}

export interface SchedulePreset {
  id: string;
  label: string;
  hoursPerWeek: number;
  description: string;
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  { id: 'reta-final', label: 'Reta final', hoursPerWeek: 42, description: 'Semanas antes da prova' },
  { id: 'integral', label: 'Dedicação integral', hoursPerWeek: 35, description: 'Estudo como atividade principal' },
  { id: 'vestibular', label: 'ENEM / Vestibular', hoursPerWeek: 25, description: 'Preparação de longo prazo' },
  { id: 'trabalha', label: 'Trabalha o dia todo', hoursPerWeek: 18, description: 'Estudo em horários livres' },
  { id: 'faculdade', label: 'Trabalho + faculdade', hoursPerWeek: 12, description: 'Rotina muito corrida' },
  { id: 'leve', label: 'Ritmo leve', hoursPerWeek: 6, description: 'Manutenção do conteúdo' },
];

export const DEFAULT_DAY_LIMITS: DayLimit[] = WEEK_DAYS.map(({ key }) => ({
  day: key,
  enabled: key !== 'dom',
  minMinutes: 60,
  maxMinutes: 180,
}));

export function totalMinutes(days: DayLimit[]): number {
  return days.filter((d) => d.enabled).reduce((sum, d) => sum + d.maxMinutes, 0);
}

export function applyPreset(days: DayLimit[], hoursPerWeek: number): DayLimit[] {
  const active = days.filter((d) => d.enabled).length || 1;
  const perDay = Math.max(15, Math.round((hoursPerWeek * 60) / active / 15) * 15);
  const min = Math.max(15, Math.round((perDay * 0.5) / 15) * 15);
  return days.map((d) => (d.enabled ? { ...d, minMinutes: min, maxMinutes: perDay } : d));
}

export function validateDays(days: DayLimit[]): string | null {
  const active = days.filter((d) => d.enabled);
  if (active.length === 0) return 'Escolha pelo menos um dia de estudo.';
  const invalid = active.find((d) => d.minMinutes > d.maxMinutes || d.maxMinutes <= 0);
  return invalid ? 'Em cada dia, o mínimo não pode passar do máximo.' : null;
}

export function buildAvailability(
  subjects: WizardSubject[],
  days: DayLimit[],
  weeklyGoalMinutes: number | undefined,
  maxSubjectsPerDay: number | undefined,
): ScheduleAvailability {
  return {
    subjects,
    days: days.map((d) =>
      d.enabled
        ? { day: d.day, minMinutes: d.minMinutes, maxMinutes: d.maxMinutes }
        : { day: d.day, minMinutes: 0, maxMinutes: 0 },
    ),
    weeklyGoalMinutes,
    maxSubjectsPerDay,
  };
}

export function averageDailyHours(days: DayLimit[]): number {
  const active = days.filter((d) => d.enabled);
  if (active.length === 0) return 1;
  const avg = active.reduce((sum, d) => sum + d.maxMinutes, 0) / active.length / 60;
  return Math.max(0.5, Math.round(avg * 2) / 2);
}
