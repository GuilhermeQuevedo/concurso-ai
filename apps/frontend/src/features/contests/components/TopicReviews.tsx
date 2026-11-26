import { Check, Clock } from 'lucide-react';
import type { SyllabusItem, TopicReview } from '../services/contest.service';

function endOfToday(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

type ReviewState = 'done' | 'due' | 'upcoming';

function reviewState(review: TopicReview): ReviewState {
  if (review.completedAt) return 'done';
  return new Date(review.scheduledFor).getTime() <= endOfToday() ? 'due' : 'upcoming';
}

const STATE_STYLES: Record<ReviewState, string> = {
  done: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  due: 'border-amber-400 bg-amber-100 text-amber-900 shadow-2xs hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200 ring-2 ring-amber-400/20',
  upcoming:
    'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function TopicReviews({
  item,
  onComplete,
}: {
  item: SyllabusItem;
  onComplete: (reviewId: string, completed: boolean) => void;
}) {
  if (!item.studied || item.reviews.length === 0) return null;

  const dueCount = item.reviews.filter((r) => reviewState(r) === 'due').length;

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5" role="group" aria-label="Ciclos de revisão espaçada">
      <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Ciclos:
      </span>
      {item.reviews.map((review) => {
        const state = reviewState(review);
        const dateStr = formatDate(review.scheduledFor);
        return (
          <button
            key={review.id}
            type="button"
            onClick={() => onComplete(review.id, !review.completedAt)}
            aria-label={`Revisão de ${review.intervalDays} dias prevista para ${dateStr} - ${state === 'done' ? 'Concluída' : state === 'due' ? 'Pendente hoje' : 'Futura'}`}
            title={`Revisão de ${dateStr} (${review.intervalDays}d)`}
            className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all touch-manipulation active:scale-95 ${STATE_STYLES[state]}`}
          >
            {state === 'done' ? (
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            ) : state === 'due' ? (
              <Clock className="h-3 w-3 stroke-[2.5] text-amber-600 dark:text-amber-400" />
            ) : null}
            <span>{`+${review.intervalDays}d`}</span>
          </button>
        );
      })}
      {dueCount > 0 && (
        <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
          {`${dueCount} hoje`}
        </span>
      )}
    </div>
  );
}
