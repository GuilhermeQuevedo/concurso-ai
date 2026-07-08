import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { StudyTask } from '../services/study-task.service';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface MonthGridProps {
  year: number;
  month: number;
  tasksByDay: Map<string, StudyTask[]>;
  selectedDay: string;
  examDays: Map<string, string>;
  onSelectDay: (key: string) => void;
  onNavigate: (delta: number) => void;
}

export function MonthGrid({ year, month, tasksByDay, selectedDay, examDays, onSelectDay, onNavigate }: MonthGridProps) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dayKey(new Date());

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => onNavigate(-1)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {MONTH_LABELS[month]} {year}
        </span>
        <button onClick={() => onNavigate(1)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="pb-1 text-center text-xs font-medium text-gray-400">
            {label}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;

          const key = dayKey(date);
          const tasks = tasksByDay.get(key) ?? [];
          const done = tasks.filter((t) => t.completed).length;
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;
          const isExamDay = examDays.has(key);

          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              className={`flex min-h-14 flex-col items-center rounded-lg border p-1 text-xs transition-colors ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                  : isExamDay
                    ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? 'bg-primary-600 text-white' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {date.getDate()}
              </span>
              {isExamDay && <span className="mt-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">PROVA</span>}
              {tasks.length > 0 && (
                <span
                  className={`mt-0.5 rounded-full px-1.5 text-[10px] font-medium ${
                    done === tasks.length
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {done}/{tasks.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
