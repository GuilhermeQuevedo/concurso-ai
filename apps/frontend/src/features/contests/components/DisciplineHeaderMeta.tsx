import { Flame } from 'lucide-react';

function priorityStyle(priority: number): string {
  if (priority >= 6) return 'border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300';
  if (priority >= 3) return 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300';
  return 'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400';
}

export function PriorityBadge({ priority }: { priority: number }) {
  return (
    <span
      title="Prioridade = importância + revisões atrasadas + cobertura"
      className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${priorityStyle(priority)}`}
    >
      <Flame className="h-3 w-3" />
      {priority.toFixed(1)}
    </span>
  );
}

export function ImportanceSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        onChange(Number(e.target.value));
      }}
      title="Importância da matéria"
      className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
    >
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>
          Imp. {n}
        </option>
      ))}
    </select>
  );
}
