import { Check } from 'lucide-react';
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
  done: 'border-green-300 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400',
  due: 'border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
  upcoming: 'border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500',
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
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Revisões</span>
      {item.reviews.map((review) => {
        const state = reviewState(review);
        return (
          <button
            key={review.id}
            onClick={() => onComplete(review.id, !review.completedAt)}
            title={`Revisão de ${formatDate(review.scheduledFor)}`}
            className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors ${STATE_STYLES[state]}`}
          >
            {state === 'done' && <Check className="h-3 w-3" />}
            +{review.intervalDays}d
          </button>
        );
      })}
      {dueCount > 0 && (
        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {dueCount} hoje
        </span>
      )}
    </div>
  );
}
