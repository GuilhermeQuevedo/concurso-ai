import { Flame, Shield } from 'lucide-react';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface DayCell {
  key: string;
  day: number;
  count: number;
  shielded: boolean;
  isFuture: boolean;
  isToday: boolean;
}

export interface ConstanciaMonthProps {
  year: number;
  month: number;
  counts: Map<string, number>;
  shielded: Set<string>;
  today: Date;
  size?: 'normal' | 'small';
}

export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function buildCells({ year, month, counts, shielded, today }: ConstanciaMonthProps): (DayCell | null)[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (DayCell | null)[] = Array.from({ length: new Date(year, month, 1).getDay() }, () => null);
  const todayKey = dateKey(today);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = dateKey(date);
    cells.push({
      key,
      day,
      count: counts.get(key) ?? 0,
      shielded: shielded.has(key),
      isFuture: date > today,
      isToday: key === todayKey,
    });
  }
  return cells;
}

function cellClass(cell: DayCell, size: 'normal' | 'small'): string {
  const height = size === 'small' ? 'h-8 sm:h-9' : 'h-10 sm:h-11';
  const base = `relative flex ${height} flex-col items-center justify-center rounded-xl text-xs transition-all duration-fast touch-manipulation cursor-default select-none`;
  const ring = cell.isToday ? ' ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-gray-900 shadow-xs' : '';
  if (cell.isFuture) return `${base} text-gray-300 dark:text-gray-700 opacity-40`;
  if (cell.count > 0)
    return `${base} bg-gradient-to-b from-amber-50 to-amber-100/70 font-bold text-amber-900 shadow-2xs hover:scale-105 active:scale-95 dark:from-amber-950/40 dark:to-amber-900/40 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/60${ring}`;
  if (cell.shielded)
    return `${base} bg-gradient-to-b from-sky-50 to-sky-100/70 font-bold text-sky-800 shadow-2xs hover:scale-105 active:scale-95 dark:from-sky-950/40 dark:to-sky-900/40 dark:text-sky-200 border border-sky-200/60 dark:border-sky-800/60${ring}`;
  return `${base} bg-gray-50/80 text-gray-600 hover:bg-gray-100 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-800${ring}`;
}

function cellTitle(cell: DayCell): string {
  if (cell.isFuture) return '';
  if (cell.shielded && cell.count === 0) return `${cell.key}: Escudo protegeu a ofensiva`;
  return `${cell.key}: ${cell.count} atividade(s) registrada(s)`;
}

export function ConstanciaMonth(props: ConstanciaMonthProps) {
  const { size = 'normal', year, month } = props;
  const cells = buildCells(props);
  const compactIcons = size === 'small';

  return (
    <div
      role="grid"
      aria-label={`Calendário de constância de ${monthTitle(year, month)}`}
      className="grid grid-cols-7 gap-1.5"
    >
      {WEEKDAYS.map((label, i) => (
        <span
          key={i}
          className="pb-1 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 select-none"
        >
          {label}
        </span>
      ))}
      {cells.map((cell, i) =>
        cell ? (
          <div
            key={cell.key}
            role="gridcell"
            aria-label={cellTitle(cell) || `Dia ${cell.day}`}
            title={cellTitle(cell)}
            className={cellClass(cell, size)}
          >
            {cell.count > 0 && (
              <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500 drop-shadow-xs motion-safe:animate-pulse" />
            )}
            {cell.count === 0 && cell.shielded && (
              <Shield className="h-3.5 w-3.5 fill-sky-400 text-sky-500 drop-shadow-xs" />
            )}
            <span
              className={
                cell.count > 0 || cell.shielded
                  ? `${compactIcons ? 'text-[9px]' : 'text-[10px]'} leading-none font-bold`
                  : 'font-semibold'
              }
            >
              {cell.day}
            </span>
          </div>
        ) : (
          <span key={`blank-${i}`} />
        ),
      )}
    </div>
  );
}

export function monthTitle(year: number, month: number): string {
  const label = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
