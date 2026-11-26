import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Target } from 'lucide-react';

import { useActiveStudy } from './active-study-context';

/**
 * Seletor do estudo ativo no topo do menu lateral:
 * Permite alternar entre "Todos os estudos" ou um edital específico.
 * Aplica:
 * - Staging e Follow Through (entrada suave com ease-standard)
 * - Lei de Fitts (alvo de toque e itens com min-h-[40px])
 */
export function ActiveStudySelector() {
  const { contests, activeContest, setActiveContestId } = useActiveStudy();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (contests.length === 0) return null;

  const choose = (id: string | null) => {
    setActiveContestId(id);
    setOpen(false);
  };

  const optionClass =
    'flex w-full min-h-[40px] items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/80 transition-colors duration-fast ease-standard hover:bg-white/8 hover:text-white select-none touch-manipulation active:scale-[0.99]';

  return (
    <div ref={rootRef} className="relative px-2.5 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Estudo ativo"
        className="flex w-full min-h-[44px] items-center gap-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-white/5 px-3 py-2 text-left transition-colors duration-fast ease-standard hover:bg-white/8 active:scale-[0.99] touch-manipulation select-none"
      >
        <Target size={16} className="shrink-0 text-[var(--color-brand-primary,#2E8C82)]" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Estudo ativo
          </span>
          <span className="block truncate text-sm font-medium text-white">
            {activeContest?.name ?? 'Todos os estudos'}
          </span>
        </span>
        <ChevronsUpDown
          size={14}
          className={`shrink-0 text-white/40 transition-transform duration-fast ease-standard ${
            open ? 'rotate-180 text-white/80' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Escolher estudo ativo"
          className="absolute inset-x-2.5 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[var(--color-border-subtle)] bg-[#1B2547] p-1.5 shadow-2xl transition-all duration-fast ease-standard animate-in fade-in slide-in-from-top-2"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!activeContest}
              onClick={() => choose(null)}
              className={optionClass}
            >
              <span className="flex-1 truncate">Todos os estudos</span>
              {!activeContest && <Check size={14} className="text-[var(--color-brand-primary,#2E8C82)]" />}
            </button>
          </li>
          {contests.map((contest) => {
            const isSelected = activeContest?.id === contest.id;
            return (
              <li key={contest.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(contest.id)}
                  className={optionClass}
                >
                  <span className="flex-1 truncate">{contest.name}</span>
                  {isSelected && <Check size={14} className="text-[var(--color-brand-primary,#2E8C82)]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
