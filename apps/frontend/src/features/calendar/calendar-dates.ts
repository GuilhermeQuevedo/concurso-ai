export type CalendarView = 'month' | 'week';

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`;
}

// Meio-dia evita que mudança de horário ou fuso empurre a data para o dia vizinho.
export function parseKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

export function addDays(key: string, amount: number): string {
  return dayKey(new Date(parseKey(key).getTime() + amount * DAY_MS));
}

export function startOfWeek(key: string): string {
  return addDays(key, -parseKey(key).getDay());
}

export function weekDays(key: string): string[] {
  const start = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Grade do mês: começa no domingo da primeira semana e termina no sábado da última.
export function monthGrid(year: number, month: number): string[] {
  const first = dayKey(new Date(year, month, 1));
  const last = dayKey(new Date(year, month + 1, 0));
  const start = startOfWeek(first);
  const end = addDays(startOfWeek(last), 6);
  const days: string[] = [];
  for (let key = start; key <= end; key = addDays(key, 1)) days.push(key);
  return days;
}

export function formatLongDate(key: string): string {
  const text = parseKey(key).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function weekTitle(key: string): string {
  const days = weekDays(key);
  const format = (k: string) => parseKey(k).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `Semana de ${format(days[0])} — ${format(days[6])}`;
}
