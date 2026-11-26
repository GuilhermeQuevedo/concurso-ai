import { useState } from 'react';
import { CheckCircle2, ChevronDown, Circle } from 'lucide-react';

import type { DisciplineStat, SyllabusItem } from '../services/contest.service';
import { ImportanceSelect, PriorityBadge } from './DisciplineHeaderMeta';
import { MiniProgress, StatusBadge, StatusIcon, statusOf } from './DisciplineStatus';
import { TopicContent } from './TopicContent';
import { TopicReviews } from './TopicReviews';

export interface DisciplineGroupProps {
  readonly stat: DisciplineStat;
  readonly items: SyllabusItem[];
  readonly onToggle: (itemId: string, studied: boolean) => void;
  readonly onReview: (reviewId: string, completed: boolean) => void;
  readonly onSetImportance: (importance: number) => void;
}

/**
 * Grupo de disciplina com tópicos expansíveis, meta-informações e acompanhamento de revisão.
 * Aplica:
 * - Solid Drawing: Container com bordas e elevação nítidas.
 * - Staging & Follow Through: Expansão fluída do acordeão e rotação de chevron.
 * - Feedback & Lei de Fitts: Alvos de toque acessíveis no cabeçalho e checkboxes.
 */
export function DisciplineGroup({
  stat,
  items,
  onToggle,
  onReview,
  onSetImportance,
}: DisciplineGroupProps) {
  const [open, setOpen] = useState(false);
  const status = statusOf(stat.studied, items.length);

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-2xs transition-all duration-fast dark:bg-slate-900 ${
        stat.inFocus
          ? 'border-slate-200 dark:border-slate-800'
          : 'border-slate-200/60 opacity-65 dark:border-slate-800/60'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full min-h-[52px] items-center justify-between gap-3 p-4 text-left transition-colors duration-fast ease-standard hover:bg-slate-50 active:bg-slate-100/60 dark:hover:bg-slate-800/60 dark:active:bg-slate-800 select-none touch-manipulation"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <StatusIcon status={status} />
          <span className="truncate font-semibold text-sm text-slate-900 dark:text-white">
            {stat.discipline}
          </span>
          <StatusBadge status={status} />
          {!stat.inFocus && (
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              fora do foco
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {stat.dueReviews > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs animate-in zoom-in-90 duration-fast">
              {stat.dueReviews} {stat.dueReviews > 1 ? 'revisões' : 'revisão'}
            </span>
          )}
          <PriorityBadge priority={stat.priority} />
          <ImportanceSelect value={stat.importance} onChange={onSetImportance} />
          <MiniProgress studied={stat.studied} total={items.length} status={status} />
          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400 font-medium">
            {stat.studied}/{items.length}
          </span>
          <ChevronDown
            className={`size-4 text-slate-400 transition-transform duration-fast ease-standard ${
              open ? 'rotate-180 text-slate-700 dark:text-slate-200' : ''
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-950/20 animate-in fade-in duration-fast ease-standard">
          {items.map((item) => (
            <div
              key={item.id}
              className="border-b border-slate-100/80 px-4 py-3 last:border-b-0 dark:border-slate-800/60"
            >
              <button
                type="button"
                onClick={() => onToggle(item.id, !item.studied)}
                className="flex w-full min-h-[36px] items-start gap-3 text-left group select-none touch-manipulation active:scale-[0.99] transition-transform duration-instant"
              >
                {item.studied ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500 transition-transform duration-instant group-active:scale-90" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-400 dark:text-slate-600" />
                )}
                <span
                  className={`text-sm transition-colors duration-fast ${
                    item.studied
                      ? 'text-slate-400 line-through dark:text-slate-500'
                      : 'text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white'
                  }`}
                >
                  {item.topic}
                </span>
              </button>
              <div className="pl-7">
                <TopicReviews item={item} onComplete={onReview} />
                <TopicContent itemId={item.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
