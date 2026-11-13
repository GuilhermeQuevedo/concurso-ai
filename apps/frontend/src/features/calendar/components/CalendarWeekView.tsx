import { Plus } from 'lucide-react';

import { dayKey, parseKey, WEEKDAY_SHORT, weekDays } from '../calendar-dates';
import type { CalendarItem } from '../calendar-items';
import { ItemChip } from './ItemChip';

interface CalendarWeekViewProps {
  anchorDay: string;
  itemsByDay: Map<string, CalendarItem[]>;
  examDays: Map<string, string>;
  onOpenItem: (item: CalendarItem) => void;
  onAdd: (key: string) => void;
}

// Semana em colunas (no celular, uma embaixo da outra). Os itens não têm horário, então listamos por dia.
export function CalendarWeekView({ anchorDay, itemsByDay, examDays, onOpenItem, onAdd }: CalendarWeekViewProps) {
  const today = dayKey(new Date());

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
      {weekDays(anchorDay).map((key) => {
        const date = parseKey(key);
        const items = itemsByDay.get(key) ?? [];
        const exam = examDays.get(key);
        return (
          <section
            key={key}
            aria-label={`Dia ${key}`}
            className={`min-h-40 rounded-xl border p-2 ${
              key === today ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
            }`}
          >
            <header className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{WEEKDAY_SHORT[date.getDay()]}</p>
                <p className={`text-lg font-bold ${key === today ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>{date.getDate()}</p>
              </div>
              <button
                type="button"
                aria-label="Adicionar neste dia"
                onClick={() => onAdd(key)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            </header>
            {exam && <p className="mb-2 rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">PROVA · {exam}</p>}
            <div className="space-y-1.5">
              {items.length === 0 && !exam && <p className="py-2 text-xs text-gray-400">Livre</p>}
              {items.map((item) => (
                <ItemChip key={item.id} item={item} onOpen={onOpenItem} large />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
