import { CheckCircle2, Circle, ListChecks, Moon } from 'lucide-react';
import { Link } from 'react-router';

import { blockLabel, type CalendarScheduleDay } from '../utils-schedule-days';

interface ScheduleDayPanelProps {
  entries: CalendarScheduleDay[];
  onToggle: (entry: CalendarScheduleDay) => void;
}

// Blocos do cronograma no dia escolhido do calendário, com o mesmo "concluído" do Cronograma.
export function ScheduleDayPanel({ entries, onToggle }: ScheduleDayPanelProps) {
  if (entries.length === 0) return null;

  return (
    <section aria-label="Cronograma do dia" className="mb-4 space-y-3">
      {entries.map((entry) => {
        const { day } = entry;
        const rest = day.type === 'descanso';
        return (
          <div
            key={`${entry.scheduleId}-${entry.weekIndex}-${entry.dayIndex}`}
            className="rounded-lg border border-teal-200 bg-teal-50/60 p-3 dark:border-teal-900 dark:bg-teal-950/30"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                <ListChecks className="h-3.5 w-3.5" /> Cronograma · {entry.scheduleTitle}
              </h4>
              <Link to="/cronograma" className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-300">
                Abrir
              </Link>
            </div>
            {rest ? (
              <p className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                <Moon className="h-4 w-4" /> Dia de descanso.
              </p>
            ) : (
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => onToggle(entry)}
                  aria-label={day.completed ? 'Desmarcar o dia' : 'Marcar o dia como concluído'}
                  className="mt-0.5 shrink-0 text-gray-400 hover:text-teal-600"
                >
                  {day.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                </button>
                <ul className={`min-w-0 flex-1 space-y-1 text-sm ${day.completed ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                  {day.blocks.length > 0 ? (
                    day.blocks.map((block, i) => (
                      <li key={i}>
                        <span className="font-medium">{block.subject}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {' '}
                          · {blockLabel(block)} · {block.hours}h
                        </span>
                      </li>
                    ))
                  ) : (
                    <li>
                      <span className="font-medium">{day.subject ?? 'Estudo'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400"> · {day.totalHours}h</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
