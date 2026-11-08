import { Search } from 'lucide-react';

import { KIND_LABELS } from '../services/document.service';
import {
  KIND_ORDER,
  type DocumentFilters,
  type GroupBy,
  type KindFilter,
  type SortBy,
} from '../utils/group-documents';

export interface SubjectOption {
  id: string;
  label: string;
}

export interface DocumentToolbarProps {
  filters: DocumentFilters;
  counts: Record<KindFilter, number>;
  subjects: SubjectOption[];
  groupBy: GroupBy;
  sortBy: SortBy;
  onFilters: (filters: DocumentFilters) => void;
  onGroupBy: (groupBy: GroupBy) => void;
  onSortBy: (sortBy: SortBy) => void;
}

const SELECT_CLASS =
  'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white';

const GROUP_OPTIONS: Array<{ value: GroupBy; label: string }> = [
  { value: 'tipo', label: 'Por tipo' },
  { value: 'disciplina', label: 'Por disciplina' },
];

export function DocumentToolbar({ filters, counts, subjects, groupBy, sortBy, onFilters, onGroupBy, onSortBy }: DocumentToolbarProps) {
  const tabs: KindFilter[] = ['TODOS', ...KIND_ORDER.filter((kind) => counts[kind] > 0)];

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onFilters({ ...filters, query: e.target.value })}
            placeholder="Buscar documento pelo nome"
            aria-label="Buscar documento pelo nome"
            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={filters.subjectId}
          onChange={(e) => onFilters({ ...filters, subjectId: e.target.value })}
          aria-label="Filtrar por disciplina"
          className={`${SELECT_CLASS} max-w-[220px]`}
        >
          <option value="">Todas as disciplinas</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => onSortBy(e.target.value as SortBy)} aria-label="Ordenar" className={SELECT_CLASS}>
          <option value="recentes">Mais recentes</option>
          <option value="nome">Nome (A–Z)</option>
        </select>
        <div role="group" aria-label="Agrupar documentos" className="flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-700">
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={groupBy === option.value}
              onClick={() => onGroupBy(option.value)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                groupBy === option.value
                  ? 'bg-primary-600 font-medium text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div role="tablist" aria-label="Tipo de documento" className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const active = filters.kind === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onFilters({ ...filters, kind: tab })}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? 'border-primary-600 bg-primary-600 font-medium text-white'
                  : 'border-gray-300 text-gray-600 hover:border-primary-400 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              {tab === 'TODOS' ? 'Todos' : KIND_LABELS[tab]}
              <span className={`text-xs ${active ? 'text-white/80' : 'text-gray-400'}`}>{counts[tab]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
