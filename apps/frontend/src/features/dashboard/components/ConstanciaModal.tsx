import { useEffect, useRef } from 'react';
import { Flame, Shield, X } from 'lucide-react';

import { ConstanciaMonth, monthTitle } from './ConstanciaMonth';

// O backend guarda cerca de 6 meses de histórico.
const MONTHS_SHOWN = 7;

export interface ConstanciaModalProps {
  counts: Map<string, number>;
  shielded: Set<string>;
  today: Date;
  streak: { current: number; longest: number; shields: number };
  onClose: () => void;
}

export function ConstanciaModal({ counts, shielded, today, streak, onClose }: ConstanciaModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const months = Array.from({ length: MONTHS_SHOWN }, (_, i) => new Date(today.getFullYear(), today.getMonth() - i, 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Constância"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sua constância</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400">
              <Flame className="h-4 w-4" /> {streak.current} dia{streak.current === 1 ? '' : 's'}
            </span>
            <span className="text-gray-400">recorde: {streak.longest}</span>
            <span className="flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400">
              <Shield className="h-4 w-4" /> {streak.shields} escudo{streak.shields === 1 ? '' : 's'}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
          {months.map((first) => (
            <section key={`${first.getFullYear()}-${first.getMonth()}`} aria-label={monthTitle(first.getFullYear(), first.getMonth())}>
              <h3 className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">{monthTitle(first.getFullYear(), first.getMonth())}</h3>
              <ConstanciaMonth
                year={first.getFullYear()}
                month={first.getMonth()}
                counts={counts}
                shielded={shielded}
                today={today}
                size="small"
              />
            </section>
          ))}
        </div>

        <p className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-gray-100 px-6 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 fill-orange-400 text-orange-500" /> dia em que você estudou
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 fill-sky-400 text-sky-500" /> dia protegido por escudo
          </span>
          <span className="basis-full">
            A cada 7 dias seguidos você ganha um escudo (até 2). Se faltar um dia, o escudo é usado automaticamente e a sequência não zera.
          </span>
        </p>
      </div>
    </div>
  );
}
