import { Link } from 'react-router';
import { Target, X, Calendar, ArrowRight } from 'lucide-react';

import { useActiveStudy } from './active-study-context';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(`${iso.slice(0, 10)}T12:00:00Z`).getTime() - Date.now()) / MS_PER_DAY);
  return days >= 0 ? days : null;
}

// Faixa na Visão Geral lembrando em qual edital a tela está focada, com o progresso dele.
export function ActiveStudyBanner() {
  const { activeContest, setActiveContestId } = useActiveStudy();
  if (!activeContest) return null;

  const days = daysUntil(activeContest.examDate);
  const percent =
    activeContest.totalTopics > 0
      ? Math.min(100, Math.round((activeContest.studiedTopics / activeContest.totalTopics) * 100))
      : 0;

  const countdownBadge = (() => {
    if (days === null) return null;
    if (days === 0) {
      return {
        label: 'Prova hoje!',
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40 font-bold',
      };
    }
    if (days <= 14) {
      return {
        label: `${days} ${days === 1 ? 'dia' : 'dias'} para prova`,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40 font-bold',
      };
    }
    if (days <= 45) {
      return {
        label: `${days} dias para prova`,
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40 font-medium',
      };
    }
    return {
      label: `${days} dias para prova`,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40 font-medium',
    };
  })();

  return (
    <div
      role="region"
      aria-label="Edital ativo em foco"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary-200/80 bg-gradient-to-r from-primary-50/80 via-primary-50/30 to-background p-4 shadow-xs transition-all duration-normal ease-standard dark:border-primary-900/50 dark:from-primary-950/40 dark:via-primary-950/20 dark:to-background sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300">
          <Target className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
              Estudo Ativo
            </span>
            <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>
            <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">
              {activeContest.name}
            </h3>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            <span>
              <strong className="font-semibold text-gray-900 dark:text-white">{activeContest.studiedTopics}</strong> de{' '}
              {activeContest.totalTopics} tópicos ({percent}%)
            </span>

            {countdownBadge && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.2 text-[11px] ${countdownBadge.className}`}>
                <Calendar className="h-3 w-3" />
                {countdownBadge.label}
              </span>
            )}
          </div>

          {/* Micro progress bar (Feedback & Secondary Action) */}
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-primary-100 dark:bg-primary-950/80">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-normal ease-standard dark:bg-primary-500"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 sm:pt-0 shrink-0">
        <Link
          to="/contests"
          className="min-h-[44px] sm:min-h-[34px] inline-flex items-center gap-1.5 rounded-lg bg-primary-100/70 px-3.5 py-1.5 text-xs font-semibold text-primary-700 transition-all duration-fast hover:bg-primary-200/80 active:scale-95 touch-manipulation dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/70"
        >
          Ver edital
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => setActiveContestId(null)}
          aria-label="Ver todos os estudos"
          title="Ver todos os estudos"
          className="min-h-[44px] min-w-[44px] sm:min-h-[34px] sm:min-w-[34px] flex items-center justify-center rounded-lg text-gray-500 transition-all duration-fast hover:bg-primary-100 hover:text-gray-900 active:scale-95 touch-manipulation dark:text-gray-400 dark:hover:bg-primary-900/50 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
