import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import type { HeatmapDay } from '../services/dashboard.service';

const WEEKS = 26;
const WEEKDAY_LABELS = ['', 'S', '', 'Q', '', 'S', ''];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function levelClass(count: number, isFuture: boolean): string {
  if (isFuture) return 'bg-transparent';
  if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
  if (count <= 2) return 'bg-primary-200 dark:bg-primary-900';
  if (count <= 5) return 'bg-primary-400 dark:bg-primary-700';
  if (count <= 10) return 'bg-primary-500 dark:bg-primary-500';
  return 'bg-primary-600 dark:bg-primary-400';
}

export function ConstanciaHeatmap({
  heatmap,
  streak,
}: {
  heatmap: HeatmapDay[];
  streak: { current: number; longest: number };
}) {
  const columns = useMemo(() => {
    const counts = new Map(heatmap.map((h) => [h.date, h.count]));
    const today = startOfDay(new Date());
    const gridEnd = addDays(today, 6 - today.getDay());
    const gridStart = addDays(gridEnd, -(WEEKS * 7 - 1));

    const weeks: { key: string; count: number; isFuture: boolean }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col: { key: string; count: number; isFuture: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(gridStart, w * 7 + d);
        const key = dateKey(date);
        col.push({ key, count: counts.get(key) ?? 0, isFuture: date > today });
      }
      weeks.push(col);
    }
    return weeks;
  }, [heatmap]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Constância</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400">
            <Flame className="h-4 w-4" />
            {streak.current} dia{streak.current === 1 ? '' : 's'}
          </span>
          <span className="text-gray-400">recorde: {streak.longest}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col gap-[3px] pt-[1px] text-[9px] text-gray-400">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="flex h-[11px] items-center leading-none">
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px] overflow-x-auto">
          {columns.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell) => (
                <div
                  key={cell.key}
                  title={cell.isFuture ? '' : `${cell.key}: ${cell.count} atividade${cell.count === 1 ? '' : 's'}`}
                  className={`h-[11px] w-[11px] rounded-[2px] ${levelClass(cell.count, cell.isFuture)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-gray-400">
        <span>menos</span>
        <span className="h-[10px] w-[10px] rounded-[2px] bg-gray-100 dark:bg-gray-800" />
        <span className="h-[10px] w-[10px] rounded-[2px] bg-primary-200 dark:bg-primary-900" />
        <span className="h-[10px] w-[10px] rounded-[2px] bg-primary-400 dark:bg-primary-700" />
        <span className="h-[10px] w-[10px] rounded-[2px] bg-primary-500" />
        <span className="h-[10px] w-[10px] rounded-[2px] bg-primary-600 dark:bg-primary-400" />
        <span>mais</span>
      </div>
    </div>
  );
}
