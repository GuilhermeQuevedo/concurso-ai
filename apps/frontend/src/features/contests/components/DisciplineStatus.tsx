import { CheckCircle2, Circle, Loader } from 'lucide-react';

export type DisciplineStatus = 'pending' | 'in_progress' | 'completed';

export const STATUS_ORDER: readonly DisciplineStatus[] = ['in_progress', 'pending', 'completed'];

export const STATUS_LABELS: Record<DisciplineStatus, string> = {
  in_progress: 'Em andamento',
  pending: 'Não iniciadas',
  completed: 'Concluídas',
};

export function statusOf(studied: number, total: number): DisciplineStatus {
  if (total > 0 && studied >= total) return 'completed';
  return studied > 0 ? 'in_progress' : 'pending';
}

export function StatusIcon({ status }: { readonly status: DisciplineStatus }) {
  if (status === 'completed') {
    return <CheckCircle2 aria-label="Concluída" className="size-5 shrink-0 text-emerald-500 dark:text-emerald-400" />;
  }
  if (status === 'in_progress') {
    return <Loader aria-label="Em andamento" className="size-5 shrink-0 text-amber-500 dark:text-amber-400 animate-spin motion-reduce:animate-none" />;
  }
  return <Circle aria-label="Não iniciada" className="size-5 shrink-0 text-slate-300 dark:text-slate-600" />;
}

export function StatusBadge({ status }: { readonly status: DisciplineStatus }) {
  if (status === 'pending') return null;
  const style =
    status === 'completed'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style}`}>
      {status === 'completed' ? 'Concluída' : 'Em andamento'}
    </span>
  );
}

export function MiniProgress({
  studied,
  total,
  status,
}: {
  readonly studied: number;
  readonly total: number;
  readonly status: DisciplineStatus;
}) {
  const percent = total > 0 ? Math.round((studied / total) * 100) : 0;
  const color = status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso da matéria"
      className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 sm:block dark:bg-slate-700"
    >
      <div
        className={`h-full rounded-full transition-all duration-base ease-standard ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

interface StatusFilterProps {
  readonly counts: Record<DisciplineStatus, number>;
  readonly value: DisciplineStatus | 'all';
  readonly onChange: (value: DisciplineStatus | 'all') => void;
}

/**
 * Filtro de disciplinas por situação com microinteração tátil e Lei de Fitts.
 */
export function StatusFilter({ counts, value, onChange }: StatusFilterProps) {
  const total = counts.in_progress + counts.pending + counts.completed;
  const options: ReadonlyArray<{ readonly key: DisciplineStatus | 'all'; readonly label: string; readonly count: number }> = [
    { key: 'all', label: 'Todas', count: total },
    ...STATUS_ORDER.map((key) => ({ key, label: STATUS_LABELS[key], count: counts[key] })),
  ];

  return (
    <div role="group" aria-label="Filtrar matérias por situação" className="mb-4 flex flex-wrap gap-2">
      {options.map(({ key, label, count }) => {
        const isSelected = value === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(key)}
            className={`inline-flex min-h-[36px] sm:min-h-[32px] items-center rounded-full border px-3.5 py-1 text-xs font-semibold select-none transition-all duration-instant ease-standard active:scale-95 touch-manipulation ${
              isSelected
                ? 'border-primary-600 bg-primary-600 text-white shadow-2xs'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {label}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
