import { ChevronDown, Filter } from 'lucide-react';
import { useState } from 'react';

import { ALL_KINDS, KIND_LABELS, type ItemFilters, type ItemKind } from '../calendar-items';

interface CalendarFiltersProps {
  filters: ItemFilters;
  subjects: Array<{ name: string; color: string }>;
  onChange: (filters: ItemFilters) => void;
}

function toggled<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
    active ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'
  }`;

export function CalendarFilters({ filters, subjects, onChange }: CalendarFiltersProps) {
  const [open, setOpen] = useState(false);
  const hiddenCount = ALL_KINDS.length - filters.kinds.size + filters.hiddenSubjects.size;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <Filter className="h-3.5 w-3.5" /> Filtros{hiddenCount > 0 && ` (${hiddenCount})`}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {ALL_KINDS.map((kind: ItemKind) => (
                <button key={kind} type="button" onClick={() => onChange({ ...filters, kinds: toggled(filters.kinds, kind) })} className={chip(filters.kinds.has(kind))}>
                  {KIND_LABELS[kind]}
                </button>
              ))}
            </div>
          </div>
          {subjects.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Matéria</p>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => {
                  const active = !filters.hiddenSubjects.has(subject.name);
                  return (
                    <button
                      key={subject.name}
                      type="button"
                      onClick={() => onChange({ ...filters, hiddenSubjects: toggled(filters.hiddenSubjects, subject.name) })}
                      className={`flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1 text-xs dark:border-gray-700 ${active ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 line-through opacity-60'}`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} />
                      {subject.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
