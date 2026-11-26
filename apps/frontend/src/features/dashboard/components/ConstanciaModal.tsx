import { useEffect, useRef } from 'react';
import { Flame, Shield, X } from 'lucide-react';
import { ConstanciaMonth, monthTitle } from './ConstanciaMonth';

// O backend armazena cerca de 6 meses de histórico.
const MONTHS_SHOWN = 7;

export interface StreakInfo {
  current: number;
  longest: number;
  shields: number;
}

export interface ConstanciaModalProps {
  counts: Map<string, number>;
  shielded: Set<string>;
  today: Date;
  streak: StreakInfo;
  onClose: () => void;
}

export function ConstanciaModal({
  counts,
  shielded,
  today,
  streak,
  onClose,
}: ConstanciaModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const months = Array.from(
    { length: MONTHS_SHOWN },
    (_, i) => new Date(today.getFullYear(), today.getMonth() - i, 1)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs motion-safe:animate-in motion-safe:fade-in duration-fast"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Constância"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:zoom-in-95 duration-fast"
      >
        {/* Header with Title and Streak Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Sua constância
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Current streak - Âmbar */}
            <span className="flex items-center gap-1.5 font-bold text-[#F2A93B] dark:text-[#f7bf67]">
              <Flame className="h-4 w-4 fill-[#F2A93B]/20" /> {streak.current} dia{streak.current === 1 ? '' : 's'}
            </span>
            {/* Record / Longest streak */}
            <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">
              recorde: <span className="font-semibold text-slate-700 dark:text-slate-300">{streak.longest}</span>
            </span>
            {/* Shields - Sky */}
            <span className="flex items-center gap-1.5 font-bold text-sky-600 dark:text-sky-400">
              <Shield className="h-4 w-4 fill-sky-600/20" /> {streak.shields} escudo{streak.shields === 1 ? '' : 's'}
            </span>
            {/* Close button with accessible 44px Fitts' target */}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 transition-colors duration-fast touch-manipulation dark:hover:text-slate-200 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Multi-month history grid */}
        <div className="grid grid-cols-1 gap-6 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
          {months.map((first) => {
            const title = monthTitle(first.getFullYear(), first.getMonth());
            return (
              <section key={`${first.getFullYear()}-${first.getMonth()}`} aria-label={title}>
                <h3 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  {title}
                </h3>
                <ConstanciaMonth
                  year={first.getFullYear()}
                  month={first.getMonth()}
                  counts={counts}
                  shielded={shielded}
                  today={today}
                  size="small"
                />
              </section>
            );
          })}
        </div>

        {/* Footer legend and explanation */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-6 py-3.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Flame className="h-3.5 w-3.5 fill-[#F2A93B] text-[#F2A93B]" /> dia em que você estudou
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Shield className="h-3.5 w-3.5 fill-sky-500 text-sky-500" /> dia protegido por escudo
          </span>
          <span className="basis-full text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            A cada 7 dias seguidos você ganha um escudo (máximo de 2). Se faltar um dia, o escudo é usado automaticamente para que a sequência não zere.
          </span>
        </div>
      </div>
    </div>
  );
}
