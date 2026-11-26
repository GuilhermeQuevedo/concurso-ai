import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useActiveStudy } from '@/features/active-study/active-study-context';
import { contestService } from '@/features/contests/services/contest.service';

export function DueReviewsPanel() {
  const queryClient = useQueryClient();

  const { activeContestId } = useActiveStudy();
  const { data: allReviews = [], isLoading } = useQuery({
    queryKey: ['due-reviews'],
    queryFn: contestService.listDueReviews,
  });
  const reviews = activeContestId ? allReviews.filter((r) => r.contestId === activeContestId) : allReviews;

  const completeMutation = useMutation({
    mutationFn: (reviewId: string) => contestService.completeReview(reviewId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['due-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div
      role="region"
      aria-label="Painel de revisões do dia"
      className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 motion-safe:animate-in motion-safe:fade-in duration-fast"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CalendarClock className="h-4 w-4" />
          </span>
          Revisões de Hoje
        </h2>
        {reviews.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
            {`${reviews.length} ${reviews.length === 1 ? 'pendente' : 'pendentes'}`}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <Sparkles className="mx-auto mb-2 h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Tudo em dia por aqui!</p>
          <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
            Você venceu a curva do esquecimento para hoje. Parabéns pelo foco constante!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reviews.slice(0, 8).map((r) => {
            const isPendingThis = completeMutation.isPending && completeMutation.variables === r.id;
            return (
              <div
                key={r.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all duration-fast ${
                  r.overdue
                    ? 'border-rose-200/80 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20'
                    : 'border-gray-200/70 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-850/40'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-gray-900 dark:text-white">{r.topic}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="truncate">{r.discipline}</span>
                    <span>·</span>
                    <span className="truncate">{r.contestName}</span>
                    {r.overdue && (
                      <span className="inline-flex items-center gap-0.5 rounded-sm bg-rose-100 px-1 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        <AlertCircle className="h-2.5 w-2.5" />
                        atrasada
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => completeMutation.mutate(r.id)}
                  disabled={isPendingThis}
                  aria-label={`Confirmar revisão de ${r.topic}`}
                  className="flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all duration-fast active:scale-95 touch-manipulation cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {isPendingThis ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Revisei</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
