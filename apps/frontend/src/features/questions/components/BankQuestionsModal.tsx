import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Landmark, Loader2, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { questionBankService, type BankFilters } from '../services/question-bank.service';
import { BankFilterFields } from './BankFilterFields';
import type { Difficulty } from '../services/question-set.service';

const QUANTITIES = [5, 10, 15, 20, 30] as const;
const DIFFICULTIES: ReadonlyArray<{ value: Difficulty | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'EASY', label: 'Fácil' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HARD', label: 'Difícil' },
];

const sectionTitle = 'mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

interface PillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Pill({ active, onClick, children }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] min-w-[44px] rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-fast touch-manipulation cursor-pointer active:scale-95 ${
        active
          ? 'bg-[#2E8C82] text-white shadow-xs hover:bg-[#26776f]'
          : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-[#2E8C82]/40 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-[#2E8C82]/40'
      }`}
    >
      {children}
    </button>
  );
}

export interface BankQuestionsModalProps {
  onClose: () => void;
  onCreated: () => void;
}

/**
 * Modal de montagem de cadernos com questões de bancas oficiais.
 * Estilizado com o Astryx Design System, Verde-Revisão e conformidade WCAG AA.
 */
export function BankQuestionsModal({ onClose, onCreated }: BankQuestionsModalProps) {
  const [filters, setFilters] = useState<BankFilters>({});
  const [quantity, setQuantity] = useState<number>(10);
  const [onlyUnanswered, setOnlyUnanswered] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const { data: facets } = useQuery({
    queryKey: ['question-bank-facets'],
    queryFn: questionBankService.facets,
  });

  const { data: available, isFetching } = useQuery({
    queryKey: ['question-bank-count', filters],
    queryFn: () => questionBankService.count(filters),
  });

  const patch = (change: Partial<BankFilters>) =>
    setFilters((current) => ({ ...current, ...change }));

  const activeFilters = Object.values(filters).filter((value) => value !== undefined).length;

  const clearFilters = () => {
    setFilters({});
    setResetKey((key) => key + 1);
  };

  const build = useMutation({
    mutationFn: () => questionBankService.buildSet({ ...filters, quantity, onlyUnanswered }),
    onSuccess: (set) => {
      toast.success(`Caderno "${set.name}" criado com sucesso.`);
      onCreated();
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Não foi possível montar o caderno de questões.'),
  });

  const empty = facets?.total === 0;
  const canBuild = !build.isPending && (available ?? 0) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="bank-modal-title"
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all duration-fast"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#52b3a8]">
                <Landmark className="h-5 w-5" />
              </span>
              <h2 id="bank-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Questões diretamente das bancas
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Provas reais já aplicadas. Caderno montado exclusivamente com questões do banco de dados oficial.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {empty ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            O banco de dados ainda não possui questões cadastradas.
          </p>
        ) : (
          <div className="space-y-6">
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className={`${sectionTitle} mb-0`}>Filtros da prova</h3>
                {activeFilters > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-[#2E8C82] hover:underline dark:text-[#52b3a8] cursor-pointer"
                  >
                    Limpar filtros ({activeFilters})
                  </button>
                )}
              </div>
              {facets && <BankFilterFields key={resetKey} facets={facets} filters={filters} onChange={patch} />}
            </section>

            <section>
              <h3 className={sectionTitle}>Nível de Dificuldade</h3>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((d) => (
                  <Pill
                    key={d.label}
                    active={(filters.difficulty ?? '') === d.value}
                    onClick={() => patch({ difficulty: d.value || undefined })}
                  >
                    {d.label}
                  </Pill>
                ))}
              </div>
            </section>

            <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={onlyUnanswered}
                onChange={(event) => setOnlyUnanswered(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#2E8C82] focus:ring-[#2E8C82]"
              />
              <span>Somente questões que ainda não respondi</span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Quantidade de questões:
              </span>
              <div className="flex gap-2">
                {QUANTITIES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuantity(n)}
                    className={`h-11 min-w-[44px] rounded-xl text-xs font-semibold transition-all touch-manipulation cursor-pointer active:scale-95 ${
                      quantity === n
                        ? 'bg-[#2E8C82] text-white shadow-xs'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <p role="status" className="text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              {isFetching
                ? 'Contando questões...'
                : `${available ?? 0} ${available === 1 ? 'questão disponível' : 'questões disponíveis'} neste filtro`}
            </p>

            <button
              type="button"
              onClick={() => build.mutate()}
              disabled={!canBuild}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-3 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-fast hover:bg-[#26776f] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99] touch-manipulation cursor-pointer"
            >
              {build.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Landmark className="h-5 w-5" />}
              <span>Montar caderno com questões das bancas</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
