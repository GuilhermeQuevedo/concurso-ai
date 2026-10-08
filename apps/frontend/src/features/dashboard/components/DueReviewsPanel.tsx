import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check } from 'lucide-react';
import { contestService } from '@/features/contests/services/contest.service';

export function DueReviewsPanel() {
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['due-reviews'],
    queryFn: contestService.listDueReviews,
  });

  const completeMutation = useMutation({
    mutationFn: (reviewId: string) => contestService.completeReview(reviewId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['due-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
        <CalendarClock className="h-4 w-4 text-amber-500" />
        Revisões de hoje
        {reviews.length > 0 && (
          <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {reviews.length}
          </span>
        )}
      </h2>

      {reviews.length === 0 ? (
        <p className="py-4 text-center text-xs text-gray-400">Nenhuma revisão pendente. Em dia! ✅</p>
      ) : (
        <div className="space-y-2">
          {reviews.slice(0, 8).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/50"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-200">{r.topic}</p>
                <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                  {r.discipline} · {r.contestName}
                  {r.overdue && <span className="ml-1 font-semibold text-red-500">atrasada</span>}
                </p>
              </div>
              <button
                onClick={() => completeMutation.mutate(r.id)}
                className="flex shrink-0 items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700 hover:bg-green-200 dark:bg-green-950 dark:text-green-400"
              >
                <Check className="h-3 w-3" />
                Revisei
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
