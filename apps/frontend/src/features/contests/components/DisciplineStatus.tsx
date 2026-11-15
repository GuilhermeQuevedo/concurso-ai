import { CheckCircle2, Circle, Loader } from 'lucide-react';

export type DisciplineStatus = 'pending' | 'in_progress' | 'completed';

export const STATUS_ORDER: DisciplineStatus[] = ['in_progress', 'pending', 'completed'];

export const STATUS_LABELS: Record<DisciplineStatus, string> = {
  in_progress: 'Em andamento',
  pending: 'Não iniciadas',
  completed: 'Concluídas',
};

export function statusOf(studied: number, total: number): DisciplineStatus {
  if (total > 0 && studied >= total) return 'completed';
  return studied > 0 ? 'in_progress' : 'pending';
}

export function StatusIcon({ status }: { status: DisciplineStatus }) {
  if (status === 'completed') return <CheckCircle2 aria-label="Concluída" className="h-5 w-5 shrink-0 text-green-500" />;
  if (status === 'in_progress') return <Loader aria-label="Em andamento" className="h-5 w-5 shrink-0 text-amber-500" />;
  return <Circle aria-label="Não iniciada" className="h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600" />;
}

export function StatusBadge({ status }: { status: DisciplineStatus }) {
  if (status === 'pending') return null;
  const style =
    status === 'completed'
      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style}`}>
      {status === 'completed' ? 'Concluída' : 'Em andamento'}
    </span>
  );
}

export function MiniProgress({ studied, total, status }: { studied: number; total: number; status: DisciplineStatus }) {
  const percent = total > 0 ? Math.round((studied / total) * 100) : 0;
  const color = status === 'completed' ? 'bg-green-500' : 'bg-amber-500';
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso da matéria"
      className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 sm:block dark:bg-gray-700"
    >
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

interface StatusFilterProps {
  counts: Record<DisciplineStatus, number>;
  value: DisciplineStatus | 'all';
  onChange: (value: DisciplineStatus | 'all') => void;
}

export function StatusFilter({ counts, value, onChange }: StatusFilterProps) {
  const total = counts.in_progress + counts.pending + counts.completed;
  const options: Array<{ key: DisciplineStatus | 'all'; label: string; count: number }> = [
    { key: 'all', label: 'Todas', count: total },
    ...STATUS_ORDER.map((key) => ({ key, label: STATUS_LABELS[key], count: counts[key] })),
  ];
  return (
    <div role="group" aria-label="Filtrar matérias por situação" className="mb-3 flex flex-wrap gap-2">
      {options.map(({ key, label, count }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            value === key
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          {label} ({count})
        </button>
      ))}
    </div>
  );
}
