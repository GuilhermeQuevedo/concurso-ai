import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';

import type { HeatmapDay } from '../services/dashboard.service';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
// O backend envia cerca de 6 meses de histórico, então não adianta navegar mais para trás.
const MAX_MONTHS_BACK = 6;

interface DayCell {
  key: string;
  day: number;
  count: number;
  isFuture: boolean;
  isToday: boolean;
}

function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function buildMonth(year: number, month: number, counts: Map<string, number>, today: Date): (DayCell | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (DayCell | null)[] = Array.from({ length: first.getDay() }, () => null);
  const todayKey = dateKey(today);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = dateKey(date);
    cells.push({ key, day, count: counts.get(key) ?? 0, isFuture: date > today, isToday: key === todayKey });
  }
  return cells;
}

function cellClass(cell: DayCell): string {
  const base = 'relative flex h-10 flex-col items-center justify-center rounded-lg text-xs';
  if (cell.isFuture) return `${base} text-gray-300 dark:text-gray-700`;
  const ring = cell.isToday ? ' ring-2 ring-primary-500' : '';
  if (cell.count > 0) return `${base} bg-orange-50 font-semibold text-orange-700 dark:bg-orange-500/10 dark:text-orange-300${ring}`;
  return `${base} bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400${ring}`;
}

export function ConstanciaHeatmap({
  heatmap,
  streak,
}: {
  heatmap: HeatmapDay[];
  streak: { current: number; longest: number };
}) {
  const [monthsBack, setMonthsBack] = useState(0);
  const today = useMemo(() => new Date(), []);
  const counts = useMemo(() => new Map(heatmap.map((h) => [h.date, h.count])), [heatmap]);

  const shown = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
  const cells = useMemo(
    () => buildMonth(shown.getFullYear(), shown.getMonth(), counts, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthsBack, counts, today],
  );
  const activeDays = cells.filter((c) => c && c.count > 0).length;
  const rawLabel = shown.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const monthLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Constância</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400">
            <Flame className="h-4 w-4" />
            {streak.current} dia{streak.current === 1 ? '' : 's'}
          </span>
          <span className="text-gray-400">recorde: {streak.longest}</span>
        </div>
      </div>

      <div className="mx-auto max-w-md">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonthsBack((m) => Math.min(MAX_MONTHS_BACK, m + 1))}
            disabled={monthsBack >= MAX_MONTHS_BACK}
            aria-label="Mês anterior"
            className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {monthLabel}
            <span className="ml-2 text-xs font-normal normal-case text-gray-400">
              {activeDays} dia{activeDays === 1 ? '' : 's'} de estudo
            </span>
          </p>
          <button
            type="button"
            onClick={() => setMonthsBack((m) => Math.max(0, m - 1))}
            disabled={monthsBack === 0}
            aria-label="Próximo mês"
            className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((label, i) => (
            <span key={i} className="pb-1 text-center text-[10px] font-medium text-gray-400">
              {label}
            </span>
          ))}
          {cells.map((cell, i) =>
            cell ? (
              <div
                key={cell.key}
                title={cell.isFuture ? '' : `${cell.key}: ${cell.count} atividade${cell.count === 1 ? '' : 's'}`}
                className={cellClass(cell)}
              >
                {cell.count > 0 && <Flame className="h-3.5 w-3.5 fill-orange-400 text-orange-500" aria-label="Dia de estudo" />}
                <span className={cell.count > 0 ? 'text-[10px] leading-none' : ''}>{cell.day}</span>
              </div>
            ) : (
              <span key={`blank-${i}`} />
            ),
          )}
        </div>

        <p className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-gray-400">
          <Flame className="h-3 w-3 fill-orange-400 text-orange-500" /> dia em que você estudou
        </p>
      </div>
    </div>
  );
}
