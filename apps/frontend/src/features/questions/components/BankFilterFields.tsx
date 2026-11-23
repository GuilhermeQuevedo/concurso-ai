import { useState } from 'react';

import type { BankFacets, BankFilters, FacetCount } from '../services/question-bank.service';

const TOP_BOARDS = 8;

export const fieldClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white';
const labelClass = 'mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400';

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function Options<T extends string | number>({ items, render }: { items: Array<FacetCount<T>>; render: (item: T) => string }) {
  return (
    <>
      {items.map((item) => (
        <option key={String(item.value)} value={String(item.value)}>{render(item.value)} ({item.count})</option>
      ))}
    </>
  );
}

interface SelectProps<T extends string | number> {
  id: string;
  items: Array<FacetCount<T>>;
  value: T | undefined;
  allLabel: string;
  render: (item: T) => string;
  onChange: (value: T | undefined) => void;
}

function FacetSelect<T extends string | number>({ id, items, value, allLabel, render, onChange }: SelectProps<T>) {
  return (
    <select
      id={id}
      value={value === undefined ? '' : String(value)}
      onChange={(event) => onChange(items.find((item) => String(item.value) === event.target.value)?.value)}
      className={fieldClass}
    >
      <option value="">{allLabel}</option>
      <Options items={items} render={render} />
    </select>
  );
}

function SearchInput({ id, listId, placeholder, items, onMatch }: { id: string; listId: string; placeholder: string; items: Array<FacetCount<string>>; onMatch: (value: string | undefined) => void }) {
  const [text, setText] = useState('');
  // O filtro só vale quando o texto bate exatamente com um item da lista.
  const change = (next: string) => {
    setText(next);
    onMatch(items.find((item) => item.value.toLowerCase() === next.trim().toLowerCase())?.value);
  };
  return (
    <>
      <input id={id} list={listId} value={text} onChange={(event) => change(event.target.value)} placeholder={placeholder} className={fieldClass} />
      <datalist id={listId}>
        {items.map((item) => <option key={item.value} value={item.value}>{item.count}</option>)}
      </datalist>
    </>
  );
}

interface BankFilterFieldsProps {
  facets: BankFacets;
  filters: BankFilters;
  onChange: (change: Partial<BankFilters>) => void;
}

// Todos os filtros de prova num formulário só, em duas colunas, em vez de uma nuvem de botões.
export function BankFilterFields({ facets, filters, onChange }: BankFilterFieldsProps) {
  const popular = facets.boards.slice(0, TOP_BOARDS);
  const others = facets.boards.slice(TOP_BOARDS);
  const boardLabel = (board: { name: string }) => board.name;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Área do concurso" htmlFor="bank-area">
        <FacetSelect id="bank-area" items={facets.areas} value={filters.area} allLabel="Todas as áreas" render={String} onChange={(area) => onChange({ area })} />
      </Field>

      <Field label="Banca" htmlFor="bank-board">
        <select
          id="bank-board"
          value={filters.examBoardId ?? ''}
          onChange={(event) => onChange({ examBoardId: event.target.value || undefined })}
          className={fieldClass}
        >
          <option value="">Todas as bancas</option>
          <optgroup label="Mais usadas">
            {popular.map(({ value, count }) => <option key={value.id} value={value.id}>{boardLabel(value)} ({count})</option>)}
          </optgroup>
          {others.length > 0 && (
            <optgroup label="Outras bancas">
              {others.map(({ value, count }) => <option key={value.id} value={value.id}>{boardLabel(value)} ({count})</option>)}
            </optgroup>
          )}
        </select>
      </Field>

      <Field label="Matéria" htmlFor="bank-subject">
        <FacetSelect
          id="bank-subject"
          items={facets.subjects.map((s) => ({ value: s.value.id, count: s.count }))}
          value={filters.subjectId}
          allLabel="Todas as matérias"
          render={(id) => facets.subjects.find((s) => s.value.id === id)?.value.name ?? id}
          onChange={(subjectId) => onChange({ subjectId })}
        />
      </Field>

      <Field label="Ano da prova" htmlFor="bank-year">
        <FacetSelect id="bank-year" items={facets.years} value={filters.examYear} allLabel="Todos os anos" render={String} onChange={(examYear) => onChange({ examYear })} />
      </Field>

      <Field label="Órgão" htmlFor="bank-organ">
        <SearchInput id="bank-organ" listId="bank-organs" placeholder="Digite para buscar" items={facets.organs} onMatch={(organ) => onChange({ organ })} />
      </Field>

      <Field label="Cargo" htmlFor="bank-position">
        <SearchInput id="bank-position" listId="bank-positions" placeholder="Digite para buscar" items={facets.positions} onMatch={(position) => onChange({ position })} />
      </Field>
    </div>
  );
}
