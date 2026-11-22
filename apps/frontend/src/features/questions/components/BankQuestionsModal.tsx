import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Landmark, Loader2, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { questionBankService, type BankFilters, type FacetCount } from '../services/question-bank.service';
import type { Difficulty } from '../services/question-set.service';

const QUANTITIES = [5, 10, 15, 20, 30];
const DIFFICULTIES: Array<{ value: Difficulty | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'EASY', label: 'Fácil' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HARD', label: 'Difícil' },
];

const field = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white';
const label = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
        active
          ? 'bg-primary-600 text-white shadow-xs'
          : 'border border-gray-200 bg-gray-50 text-gray-700 hover:border-primary-400 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function FacetSelect<T extends string | number>({ title, items, value, render, onChange }: {
  title: string;
  items: Array<FacetCount<T>>;
  value: T | undefined;
  render: (item: T) => string;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <div>
      <label className={label}>{title}</label>
      <select
        value={value ?? ''}
        onChange={(event) => {
          const picked = items.find((item) => String(item.value) === event.target.value);
          onChange(picked?.value);
        }}
        className={field}
      >
        <option value="">Todos</option>
        {items.map((item) => (
          <option key={String(item.value)} value={String(item.value)}>
            {render(item.value)} ({item.count})
          </option>
        ))}
      </select>
    </div>
  );
}

export function BankQuestionsModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [filters, setFilters] = useState<BankFilters>({});
  const [quantity, setQuantity] = useState(10);
  const [onlyUnanswered, setOnlyUnanswered] = useState(true);

  const { data: facets } = useQuery({ queryKey: ['question-bank-facets'], queryFn: questionBankService.facets });
  const { data: available, isFetching } = useQuery({
    queryKey: ['question-bank-count', filters],
    queryFn: () => questionBankService.count(filters),
  });

  const patch = (change: Partial<BankFilters>) => setFilters((current) => ({ ...current, ...change }));

  const build = useMutation({
    mutationFn: () => questionBankService.buildSet({ ...filters, quantity, onlyUnanswered }),
    onSuccess: (set) => {
      toast.success(`Caderno "${set.name}" criado.`);
      onCreated();
    },
    onError: (error: Error) => toast.error(error.message || 'Não foi possível montar o caderno.'),
  });

  const empty = facets?.total === 0;
  const canBuild = !build.isPending && (available ?? 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Questões diretamente das bancas"
        className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Questões diretamente das bancas</h2>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Provas reais já aplicadas. Sem IA: o caderno é montado com o que está no banco.
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {empty ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">O banco de questões ainda não tem questões cadastradas.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={label}>Banca</label>
              <div className="flex flex-wrap gap-1.5">
                <Pill active={!filters.examBoardId} onClick={() => patch({ examBoardId: undefined })}>Todas</Pill>
                {facets?.boards.map(({ value, count }) => (
                  <Pill key={value.id} active={filters.examBoardId === value.id} onClick={() => patch({ examBoardId: value.id })}>
                    {value.name} · {count}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <FacetSelect title="Matéria" items={facets?.subjects.map((s) => ({ value: s.value.id, count: s.count })) ?? []} value={filters.subjectId}
                render={(id) => facets?.subjects.find((s) => s.value.id === id)?.value.name ?? id} onChange={(subjectId) => patch({ subjectId })} />
              <FacetSelect title="Ano" items={facets?.years ?? []} value={filters.examYear} render={String} onChange={(examYear) => patch({ examYear })} />
              <FacetSelect title="Órgão" items={facets?.organs ?? []} value={filters.organ} render={(organ) => organ} onChange={(organ) => patch({ organ })} />
            </div>

            <div>
              <label className={label}>Dificuldade</label>
              <div className="flex flex-wrap gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <Pill key={d.label} active={(filters.difficulty ?? '') === d.value} onClick={() => patch({ difficulty: d.value || undefined })}>{d.label}</Pill>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <input type="checkbox" checked={onlyUnanswered} onChange={(event) => setOnlyUnanswered(event.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              Só questões que ainda não respondi
            </label>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade:</span>
              <div className="flex gap-1.5">
                {QUANTITIES.map((n) => (
                  <button key={n} type="button" onClick={() => setQuantity(n)}
                    className={`h-8 w-11 rounded-lg text-xs font-semibold ${quantity === n ? 'bg-primary-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <p role="status" className="text-center text-sm text-gray-500 dark:text-gray-400">
              {isFetching ? 'Contando...' : `${available ?? 0} ${available === 1 ? 'questão disponível' : 'questões disponíveis'} neste filtro`}
            </p>

            <button
              type="button"
              onClick={() => build.mutate()}
              disabled={!canBuild}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-700 disabled:opacity-50"
            >
              {build.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
              Montar caderno com questões das bancas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
