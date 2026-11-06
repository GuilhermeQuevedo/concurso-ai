import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleWeek, ScheduleDay, ScheduleBlock } from '../types';
import { ScheduleDayRow } from './ScheduleDayRow';

export interface WeekCollapsibleProps {
  week: ScheduleWeek;
  weekIndex: number;
  defaultOpen: boolean;
  onToggleDay: (weekIndex: number, dayIndex: number) => void;
  onGenerate: (dayIndex: number, day: ScheduleDay, block?: ScheduleBlock) => void;
}

export function WeekCollapsible({
  week,
  weekIndex,
  defaultOpen,
  onToggleDay,
  onGenerate,
}: WeekCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const phaseLabel =
    week.phase === 'base'
      ? 'Fase Base (50%)'
      : week.phase === 'intensification'
      ? 'Fase Intensificação (30%)'
      : 'Fase Reta Final / Revisões (20%)';

  const phaseBadgeClass =
    week.phase === 'base'
      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
      : week.phase === 'intensification'
      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Semana {week.weekNumber}
            </h3>
            <span className={cn('rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', phaseBadgeClass)}>
              {phaseLabel}
            </span>
          </div>
          {week.theme && (
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
              {week.theme}
            </span>
          )}
        </div>
        <div className="rounded-full p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="flex flex-col border-t border-gray-200 dark:border-gray-800">
          {week.days.map((day, dayIndex) => (
            <ScheduleDayRow
              key={dayIndex}
              day={day}
              onToggleCompletion={() => onToggleDay(weekIndex, dayIndex)}
              onGenerate={(block?: ScheduleBlock) => onGenerate(dayIndex, day, block)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
