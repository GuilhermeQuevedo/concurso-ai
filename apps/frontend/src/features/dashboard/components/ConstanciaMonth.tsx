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
  const height = size === 'small' ? 'h-8' : 'h-10';
  const base = `relative flex ${height} flex-col items-center justify-center rounded-lg text-xs`;
  const ring = cell.isToday ? ' ring-2 ring-primary-500' : '';
  if (cell.isFuture) return `${base} text-gray-300 dark:text-gray-700`;
  if (cell.count > 0) return `${base} bg-orange-50 font-semibold text-orange-700 dark:bg-orange-500/10 dark:text-orange-300${ring}`;
  if (cell.shielded) return `${base} bg-sky-50 font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300${ring}`;
  return `${base} bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400${ring}`;
}

function cellTitle(cell: DayCell): string {
  if (cell.isFuture) return '';
  if (cell.shielded && cell.count === 0) return `${cell.key}: escudo protegeu a sequência`;
  return `${cell.key}: ${cell.count} atividade${cell.count === 1 ? '' : 's'}`;
}

export function ConstanciaMonth(props: ConstanciaMonthProps) {
  const { size = 'normal' } = props;
  const cells = buildCells(props);
  const compactIcons = size === 'small';

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAYS.map((label, i) => (
        <span key={i} className="pb-1 text-center text-[10px] font-medium text-gray-400">
          {label}
        </span>
      ))}
      {cells.map((cell, i) =>
        cell ? (
          <div key={cell.key} title={cellTitle(cell)} className={cellClass(cell, size)}>
            {cell.count > 0 && <Flame className="h-3.5 w-3.5 fill-orange-400 text-orange-500" aria-label="Dia de estudo" />}
            {cell.count === 0 && cell.shielded && <Shield className="h-3.5 w-3.5 fill-sky-400 text-sky-500" aria-label="Dia protegido por escudo" />}
            <span className={cell.count > 0 || cell.shielded ? `${compactIcons ? 'text-[9px]' : 'text-[10px]'} leading-none` : ''}>
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
