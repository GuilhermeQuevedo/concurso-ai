import { useState } from 'react';
import { Target, Pencil, Check, Clock, TrendingUp, Sparkles } from 'lucide-react';
import type { DashboardSummary } from '../services/dashboard.service';

export function MetasCard({
  goal,
  averages,
  onSetGoal,
  saving,
}: {
  goal: DashboardSummary['goal'];
  averages: DashboardSummary['averages'];
  onSetGoal: (value: number) => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.dailyQuestions);

  const progress =
    goal.dailyQuestions > 0 ? Math.min(100, Math.round((goal.todayQuestions / goal.dailyQuestions) * 100)) : 0;
  const reached = goal.todayQuestions >= goal.dailyQuestions && goal.dailyQuestions > 0;

  const save = () => {
    onSetGoal(Math.max(1, draft));
    setEditing(false);
  };

  return (
    <div
      role="region"
      aria-label="Meta diária de resolução de questões"
      className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-all duration-fast motion-safe:animate-in motion-safe:fade-in ${
        reached
          ? 'border-emerald-200/90 bg-gradient-to-b from-white to-emerald-50/30 dark:border-emerald-900/60 dark:bg-gray-900'
          : 'border-gray-200/90 bg-white dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${reached ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-primary-600/10 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'}`}>
            <Target className="h-4 w-4" />
          </span>
          Meta Diária
        </h2>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={500}
              value={draft}
              onChange={(e) => setDraft(Number(e.target.value))}
              aria-label="Definir nova meta diária de questões"
              className="h-8 w-20 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={save}
              disabled={saving}
              aria-label="Salvar meta"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-xs transition-all hover:bg-primary-700 active:scale-95 touch-manipulation cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(goal.dailyQuestions);
              setEditing(true);
            }}
            aria-label="Editar meta diária"
            className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors touch-manipulation cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Pencil className="h-3 w-3" />
            Editar
          </button>
        )}
      </div>

      <div className="mb-2 flex items-end justify-between">
        <span className="text-3xl font-extrabold tracking-tight tabular-nums text-gray-900 dark:text-white">
          {goal.todayQuestions}
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{`/${goal.dailyQuestions} questões`}</span>
        </span>
        <span
          className={`inline-flex items-center gap-1 text-xs font-bold ${
            reached
              ? 'text-emerald-600 dark:text-emerald-400 motion-safe:animate-bounce'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {reached ? (
            <>
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Meta Batida! 🎉
            </>
          ) : (
            `${progress}%`
          )}
        </span>
      </div>

      {/* Progress Bar with continuous feedback (Limiar de Doherty) */}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da meta diária de questões"
      >
        <div
          className={`h-full rounded-full transition-all duration-slow ease-standard shadow-2xs ${
            reached
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              : 'bg-gradient-to-r from-primary-600 to-primary-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5 border-t border-gray-100 pt-3.5 dark:border-gray-800">
        <Metric icon={Clock} label="Tempo Hoje" value={`${goal.todayStudyMinutes}min`} />
        <Metric icon={TrendingUp} label="Média / Dia Ativo" value={String(averages.perActiveDay)} />
        <Metric icon={Target} label="Últimos 7 Dias" value={String(averages.questionsLast7)} />
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-gray-50/70 p-2.5 text-center transition-colors dark:border-gray-800 dark:bg-gray-800/40">
      <Icon className="mx-auto mb-1 h-4 w-4 text-primary-600 dark:text-primary-400" />
      <p className="text-sm font-extrabold tabular-nums text-gray-900 dark:text-white">{value}</p>
      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
    </div>
  );
}
