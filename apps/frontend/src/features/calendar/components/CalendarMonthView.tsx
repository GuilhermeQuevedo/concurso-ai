import { Plus } from 'lucide-react';

import { dayKey, MONTH_NAMES, monthGrid, parseKey, WEEKDAY_SHORT } from '../calendar-dates';
import type { CalendarItem } from '../calendar-items';
import { ItemChip } from './ItemChip';

const MAX_CHIPS = 3;

interface CalendarMonthViewProps {
  year: number;
  month: number;
  itemsByDay: Map<string, CalendarItem[]>;
  examDays: Map<string, string>;
  selectedDay: string;
  onSelectDay: (key: string) => void;
  onOpenItem: (item: CalendarItem) => void;
  onAdd: (key: string) => void;
}

export function CalendarMonthView({ year, month, itemsByDay, examDays, selectedDay, onSelectDay, onOpenItem, onAdd }: CalendarMonthViewProps) {
  const today = dayKey(new Date());
  const days = monthGrid(year, month);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
        {WEEKDAY_SHORT.map((label) => (
          <div key={label} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((key) => {
          const date = parseKey(key);
          const items = itemsByDay.get(key) ?? [];
          const inMonth = date.getMonth() === month;
          const exam = examDays.get(key);
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-label={`Dia ${key}`}
              onClick={() => onSelectDay(key)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectDay(key)}
              className={`group relative min-h-24 cursor-pointer border-b border-r border-gray-100 p-1 text-left dark:border-gray-800 ${
                key === selectedDay ? 'bg-primary-50/60 ring-1 ring-inset ring-primary-500 dark:bg-primary-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
              } ${inMonth ? '' : 'opacity-40'}`}
            >
              <div className="mb-0.5 flex items-center justify-between">
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold ${
                    key === today ? 'bg-primary-600 text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {date.getDate()}
                </span>
                <button
                  type="button"
                  aria-label="Adicionar neste dia"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(key);
                  }}
                  className="rounded p-0.5 text-gray-400 opacity-0 hover:text-primary-600 focus:opacity-100 group-hover:opacity-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {exam && <p className="mb-0.5 truncate rounded bg-red-100 px-1 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">PROVA · {exam}</p>}
              <div className="space-y-0.5">
                {items.slice(0, MAX_CHIPS).map((item) => (
                  <ItemChip key={item.id} item={item} onOpen={onOpenItem} />
                ))}
                {items.length > MAX_CHIPS && <p className="px-1 text-[10px] font-medium text-gray-500">+{items.length - MAX_CHIPS} mais</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function monthTitle(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}
