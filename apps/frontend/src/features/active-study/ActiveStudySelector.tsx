import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Target } from 'lucide-react';

import { useActiveStudy } from './active-study-context';

// Seletor do estudo ativo no topo do menu: "Todos os estudos" ou um edital específico.
export function ActiveStudySelector() {
  const { contests, activeContest, setActiveContestId } = useActiveStudy();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
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
  const option = 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/8 hover:text-white';

  return (
    <div ref={rootRef} className="relative px-2.5 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Estudo ativo"
        className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/8"
      >
        <Target size={16} className="shrink-0 text-teal-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/40">Estudo ativo</span>
          <span className="block truncate text-sm font-medium text-white">{activeContest?.name ?? 'Todos os estudos'}</span>
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-white/40" />
      </button>

      {open && (
        <ul role="listbox" aria-label="Escolher estudo ativo" className="absolute inset-x-2.5 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#1B2547] p-1.5 shadow-2xl">
          <li>
            <button type="button" role="option" aria-selected={!activeContest} onClick={() => choose(null)} className={option}>
              <span className="flex-1">Todos os estudos</span>
              {!activeContest && <Check size={14} className="text-teal-400" />}
            </button>
          </li>
          {contests.map((c) => (
            <li key={c.id}>
              <button type="button" role="option" aria-selected={activeContest?.id === c.id} onClick={() => choose(c.id)} className={option}>
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                {activeContest?.id === c.id && <Check size={14} className="shrink-0 text-teal-400" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
