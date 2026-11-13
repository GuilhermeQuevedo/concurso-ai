import { useState } from 'react';
import { CheckCircle2, ChevronDown, Circle } from 'lucide-react';

import type { DisciplineStat, SyllabusItem } from '../services/contest.service';
import { ImportanceSelect, PriorityBadge } from './DisciplineHeaderMeta';
import { MiniProgress, StatusBadge, StatusIcon, statusOf } from './DisciplineStatus';
import { TopicContent } from './TopicContent';
import { TopicReviews } from './TopicReviews';

export function DisciplineGroup({
  stat,
  items,
  onToggle,
  onReview,
  onSetImportance,
}: {
  stat: DisciplineStat;
  items: SyllabusItem[];
  onToggle: (itemId: string, studied: boolean) => void;
  onReview: (reviewId: string, completed: boolean) => void;
  onSetImportance: (importance: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const status = statusOf(stat.studied, items.length);

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white dark:bg-gray-900 ${
        stat.inFocus ? 'border-gray-200 dark:border-gray-800' : 'border-gray-200 opacity-60 dark:border-gray-800'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex min-w-0 items-center gap-2">
          <StatusIcon status={status} />
          <span className="truncate font-medium text-gray-900 dark:text-white">{stat.discipline}</span>
          <StatusBadge status={status} />
          {!stat.inFocus && (
            <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              fora do foco
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {stat.dueReviews > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {stat.dueReviews} revisão{stat.dueReviews > 1 ? 'ões' : ''}
            </span>
          )}
          <PriorityBadge priority={stat.priority} />
          <ImportanceSelect value={stat.importance} onChange={onSetImportance} />
          <MiniProgress studied={stat.studied} total={items.length} status={status} />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {stat.studied}/{items.length}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          {items.map((item) => (
            <div key={item.id} className="border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800">
              <button
                onClick={() => onToggle(item.id, !item.studied)}
                className="flex w-full items-start gap-3 text-left"
              >
                {item.studied ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                )}
                <span
                  className={`text-sm ${
                    item.studied
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-gray-700 dark:text-gray-300'
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
