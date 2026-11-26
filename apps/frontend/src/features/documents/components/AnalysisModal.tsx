import { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';

const STEPS = [
  { label: 'Lendo o edital...', fromSeconds: 0 },
  { label: 'Identificando as matérias...', fromSeconds: 6 },
  { label: 'Mapeando os tópicos programáticos...', fromSeconds: 18 },
  { label: 'Organizando o conteúdo programático...', fromSeconds: 40 },
];

export function currentStep(elapsedSeconds: number): number {
  let step = 0;
  STEPS.forEach((candidate, index) => {
    if (elapsedSeconds >= candidate.fromSeconds) step = index;
  });
  return step;
}

export interface AnalysisModalProps {
  open: boolean;
  error: string | null;
  inParts: boolean;
  firstPages: number | null;
  onCancel: () => void;
  onClose: () => void;
}

/**
 * Modal de progresso da análise com IA.
 * Estilizado com o design system Astryx, paleta Verde-Revisão (#2E8C82) e acessibilidade completa.
 */
export function AnalysisModal({
  open,
  error,
  inParts,
  firstPages,
  onCancel,
  onClose,
}: AnalysisModalProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => {
      clearInterval(timer);
      setElapsed(0);
    };
  }, [open]);

  useEffect(() => {
    if (!open && !error) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (error) onClose();
        else onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, error, onClose, onCancel]);

  if (!open && !error) return null;
  const step = currentStep(elapsed);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-7 sm:p-8 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all duration-fast">
        <button
          type="button"
          onClick={error ? onClose : onCancel}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#52b3a8]">
          <Sparkles className="h-7 w-7" />
        </div>

        {error ? (
          <>
            <h2 id="analysis-modal-title" className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              Não foi possível concluir a análise
            </h2>
            <p className="mb-6 text-sm font-medium text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] w-full rounded-xl bg-[#2E8C82] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#26776f] cursor-pointer"
            >
              Entendi
            </button>
          </>
        ) : (
          <>
            <h2 id="analysis-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Analisando com Inteligência Artificial
            </h2>
            <p className="mb-1 mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Isso pode levar de 1 a 2 minutos. Pode deixar esta tela aberta.
            </p>
            {inParts && (
              <p className="mb-4 mt-2 rounded-xl border border-[#F2A93B]/40 bg-[#F2A93B]/10 p-2.5 text-xs font-semibold text-[#8a5d1b] dark:border-[#F2A93B]/40 dark:bg-[#F2A93B]/15 dark:text-[#f8c16d]">
                Documento extenso: processando primeiro {firstPages ?? 50} páginas. O restante será lido em segundo plano.
              </p>
            )}
            <ol className="mx-auto mb-6 mt-5 max-w-xs space-y-3 text-left">
              {STEPS.map((item, index) => {
                const done = index < step;
                const active = index === step;
                return (
                  <li
                    key={item.label}
                    className={`flex items-center gap-3 text-sm transition-colors ${
                      active
                        ? 'font-bold text-slate-900 dark:text-white'
                        : done
                        ? 'font-medium text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        active
                          ? 'bg-[#2E8C82] text-white shadow-xs'
                          : done
                          ? 'bg-[#2E8C82] text-white'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {done ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : active ? (
                        <Loader2 className="h-4 w-4 animate-spin stroke-[2.5]" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ol>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-[44px] items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
            >
              Cancelar análise
            </button>
          </>
        )}
      </div>
    </div>
  );
}
