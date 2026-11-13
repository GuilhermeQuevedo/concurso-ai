import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ScheduleBlock, ScheduleDay, ScheduleWeek } from '../types';
import { ScheduleDayRow } from './ScheduleDayRow';

export interface WeekCollapsibleProps {
  week: ScheduleWeek;
  weekIndex: number;
  defaultOpen: boolean;
  onToggleDay: (weekIndex: number, dayIndex: number) => void;
  onGenerate: (dayIndex: number, day: ScheduleDay, block?: ScheduleBlock) => void;
}

const PHASE_LABEL: Record<ScheduleWeek['phase'], string> = {
  base: 'Fase Base (50%)',
  intensification: 'Fase Intensificação (30%)',
  revision: 'Fase Reta Final / Revisões (20%)',
};

const PHASE_BADGE: Record<ScheduleWeek['phase'], string> = {
  base: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  intensification: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  revision: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

export function WeekCollapsible({ week, weekIndex, defaultOpen, onToggleDay, onGenerate }: WeekCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 shadow-md transition-all duration-300 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={cn(
          'w-full flex items-center justify-between p-4 sm:p-5 bg-slate-900/80 hover:bg-slate-800/60 transition-colors text-left cursor-pointer outline-none',
          isOpen ? 'border-b border-slate-800/80' : ''
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-full bg-slate-800 text-slate-400">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-display font-semibold text-base sm:text-lg text-white">
                Semana {week.weekNumber}
              </h3>
              <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border', PHASE_BADGE[week.phase])}>
                {PHASE_LABEL[week.phase]}
              </span>
            </div>
            {week.theme && <p className="text-xs text-slate-400 mt-0.5">{week.theme}</p>}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="divide-y divide-slate-800/70 bg-slate-950/40">
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
