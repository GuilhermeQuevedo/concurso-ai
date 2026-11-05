import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ScheduleBlock, ScheduleDay, ScheduleWeek } from '../types';
import { ScheduleDayRow } from './ScheduleDayRow';

interface WeekCollapsibleProps {
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
  base: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  intensification: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  revision: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export function WeekCollapsible({ week, weekIndex, defaultOpen, onToggleDay, onGenerate }: WeekCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-5 bg-card hover:bg-muted/30 transition-colors text-left cursor-pointer"
      >
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-base sm:text-lg text-foreground">Semana {week.weekNumber}</h3>
            <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', PHASE_BADGE[week.phase])}>
              {PHASE_LABEL[week.phase]}
            </span>
          </div>
          {week.theme && <span className="text-xs font-medium text-primary uppercase tracking-wide">{week.theme}</span>}
        </div>
        <div className="p-1 rounded-full bg-secondary text-muted-foreground">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="flex flex-col bg-background/50 border-t border-border/50">
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
