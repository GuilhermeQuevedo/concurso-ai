import { Building2, CalendarDays, CheckCircle2, Circle, Clock } from 'lucide-react';
import type { ContestSummary } from '../services/contest.service';

/**
 * Calcula a contagem regressiva de dias até a prova considerando fuso UTC.
 */
export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
  const exam = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exam.getTime() - today.getTime()) / 86400000);
}

/**
 * Formata data da prova no padrão brasileiro DD/MM/YYYY.
 */
export function formatExamDate(dateStr: string): string {
  const [year, month, day] = dateStr.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export interface ContestCardProps {
  readonly contest: ContestSummary;
  readonly onOpen: () => void;
  readonly onToggleDone: (done: boolean) => void;
  readonly togglePending?: boolean;
}

/**
 * Card de visualização e ação rápida de Edital/Concurso.
 * Aplica:
 * - Solid Drawing & Appeal: Elevação no hover, profundidade com sombras suaves e borda de contraste.
 * - Pose to Pose: Estados bem definidos (ativo vs concluído com selo e opacidade atenuada).
 * - Lei de Fitts: Alvo de toque de 44x44px no botão de conclusão rápida.
 * - Feedback: Transições aceleradas por GPU nos tokens duration-fast e ease-standard.
 */
export function ContestCard({
  contest,
  onOpen,
  onToggleDone,
  togglePending = false,
}: ContestCardProps) {
  const isDone = contest.status === 'DONE';
  const days = daysUntil(contest.examDate);
  const progress =
    contest.totalTopics > 0
      ? Math.round((contest.studiedTopics / contest.totalTopics) * 100)
      : 0;

  const countdownStyle =
    days === null
      ? ''
      : days <= 14
        ? 'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
        : days <= 45
          ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';

  return (
    <div
      className={`group relative flex w-full flex-col justify-between gap-4 rounded-2xl border bg-white p-5 text-left shadow-xs transition-all duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0 dark:bg-slate-900 ${
        isDone
          ? 'border-emerald-200/60 bg-emerald-50/20 opacity-80 dark:border-emerald-900/40 dark:bg-emerald-950/10'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          {/* Botão de Marcar como Concluído com alvo de 44px acessível */}
          <button
            type="button"
            disabled={togglePending}
            aria-pressed={isDone}
            aria-label={isDone ? 'Reabrir edital' : 'Marcar edital como concluído'}
            title={isDone ? 'Concluído. Clique para reabrir' : 'Marcar como concluído'}
            onClick={() => onToggleDone(!isDone)}
            className="relative z-10 -ml-2 -mt-2 flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-slate-400 transition-transform duration-instant active:scale-90 hover:text-emerald-600 disabled:opacity-50 touch-manipulation"
          >
            {isDone ? (
              <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-instant" />
            ) : (
              <Circle className="size-6 text-slate-300 transition-colors hover:text-slate-400 dark:text-slate-600" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h3
              className={`font-semibold text-base text-slate-900 dark:text-white transition-colors duration-fast ${
                isDone ? 'line-through text-slate-500 dark:text-slate-400' : 'group-hover:text-primary-600 dark:group-hover:text-primary-400'
              }`}
            >
              <button
                type="button"
                onClick={onOpen}
                className="text-left outline-none cursor-pointer after:absolute after:inset-0 after:content-[''] focus-visible:underline"
              >
                {contest.name}
              </button>
            </h3>

            {contest.role && (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {contest.role}
              </p>
            )}

            {/* Badges de Metadados com Solid Drawing */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
              {contest.examBoard && (
                <span className="inline-flex items-center gap-1 rounded-md border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
                  <Building2 className="size-3" />
                  {contest.examBoard}
                </span>
              )}
              {contest.examDate && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                  <CalendarDays className="size-3" />
                  {formatExamDate(contest.examDate)}
                </span>
              )}
              {isDone && (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Concluído
                </span>
              )}
            </div>
          </div>

          {/* Contador Regressivo em Destaque Visual */}
          {days !== null && days >= 0 && (
            <div
              className={`flex shrink-0 flex-col items-center justify-center rounded-xl border px-3 py-1.5 text-center shadow-2xs ${countdownStyle}`}
            >
              <span className="font-bold text-2xl leading-tight tabular-nums">{days}</span>
              <span className="flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-80">
                <Clock className="size-2.5" />
                dias
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Progresso com Follow Through Suave */}
      {contest.totalTopics > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              Conteúdo programático
            </span>
            <span className="tabular-nums font-medium">
              {contest.studiedTopics}/{contest.totalTopics} tópicos ({progress}%)
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso do edital"
            className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <div
              className={`h-full rounded-full transition-all duration-base ease-standard ${
                progress === 100 ? 'bg-emerald-500' : 'bg-primary-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
