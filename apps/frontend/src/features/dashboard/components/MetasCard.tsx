import { useState } from 'react';
import { Target, Pencil, Check, Clock, TrendingUp } from 'lucide-react';
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

  const progress = goal.dailyQuestions > 0 ? Math.min(100, Math.round((goal.todayQuestions / goal.dailyQuestions) * 100)) : 0;
  const reached = goal.todayQuestions >= goal.dailyQuestions;

  const save = () => {
    onSetGoal(draft);
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Target className="h-4 w-4 text-primary-600" />
          Meta diária
        </h2>
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={500}
              value={draft}
              onChange={(e) => setDraft(Number(e.target.value))}
              className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={save}
              disabled={saving}
              className="rounded bg-primary-600 p-1 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setDraft(goal.dailyQuestions);
              setEditing(true);
            }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Pencil className="h-3 w-3" />
            editar
          </button>
        )}
      </div>

      <div className="mb-1 flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {goal.todayQuestions}
          <span className="text-sm font-normal text-gray-400">/{goal.dailyQuestions} questões</span>
        </span>
        <span className={`text-xs font-medium ${reached ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
          {reached ? 'Meta batida! 🎉' : `${progress}%`}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all ${reached ? 'bg-green-500' : 'bg-primary-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Metric icon={Clock} label="Hoje" value={`${goal.todayStudyMinutes}min`} />
        <Metric icon={TrendingUp} label="Média/dia ativo" value={String(averages.perActiveDay)} />
        <Metric icon={Target} label="7 dias" value={String(averages.questionsLast7)} />
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-gray-400" />
      <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
