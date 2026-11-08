import type { PendingErrorDTO } from '../services/error-notebook.service';
import {
  NO_FILTERS,
  countWith,
  subjectOptions,
  type ErrorFilters,
  type OriginFilter,
  type StatusFilter,
} from '../utils/filter-errors';

const ORIGINS: { value: OriginFilter; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'SIMULADO', label: 'Questões' },
  { value: 'FLASHCARD', label: 'Flashcards' },
];

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: 'TODOS', label: 'Errei e dúvidas' },
  { value: 'ERREI', label: 'Errei' },
  { value: 'DUVIDA', label: 'Em dúvida' },
];

export interface ErrorFilterBarProps {
  errors: PendingErrorDTO[];
  filters: ErrorFilters;
  onChange: (filters: ErrorFilters) => void;
}

function Chip({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? 'border-amber-500 bg-amber-500 font-semibold text-white'
          : 'border-amber-200 text-gray-600 hover:border-amber-400 dark:border-amber-900/60 dark:text-gray-300'
      }`}
    >
      {label} <span className={active ? 'text-white/80' : 'text-gray-400'}>{count}</span>
    </button>
  );
}

// Categorias do Caderno de Erros: de onde veio (questão ou flashcard), se foi erro ou dúvida e a matéria.
export function ErrorFilterBar({ errors, filters, onChange }: ErrorFilterBarProps) {
  const subjects = subjectOptions(errors, filters);
  const filtering = filters.origin !== 'TODOS' || filters.status !== 'TODOS' || filters.subjectId !== '';

  return (
    <div className="space-y-2">
      <div role="tablist" aria-label="Origem do erro" className="flex gap-1.5 overflow-x-auto pb-1">
        {ORIGINS.map((o) => (
          <Chip key={o.value} active={filters.origin === o.value} label={o.label} count={countWith(errors, filters, { origin: o.value })} onClick={() => onChange({ ...filters, origin: o.value })} />
        ))}
      </div>
      <div role="tablist" aria-label="Tipo de erro" className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUSES.map((st) => (
          <Chip key={st.value} active={filters.status === st.value} label={st.label} count={countWith(errors, filters, { status: st.value })} onClick={() => onChange({ ...filters, status: st.value })} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.subjectId}
          onChange={(e) => onChange({ ...filters, subjectId: e.target.value })}
          aria-label="Filtrar por matéria"
          className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs text-gray-800 dark:border-amber-900/60 dark:bg-gray-900 dark:text-gray-200"
        >
          <option value="">Todas as matérias</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.count})
            </option>
          ))}
        </select>
        {filtering && (
          <button type="button" onClick={() => onChange(NO_FILTERS)} className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-400">
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
