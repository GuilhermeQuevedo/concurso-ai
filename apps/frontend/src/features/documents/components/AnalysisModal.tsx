import { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';

const STEPS = [
  { label: 'Lendo o edital...', fromSeconds: 0 },
  { label: 'Identificando as matérias...', fromSeconds: 6 },
  { label: 'Mapeando os tópicos...', fromSeconds: 18 },
  { label: 'Organizando o conteúdo programático...', fromSeconds: 40 },
];

export function currentStep(elapsedSeconds: number): number {
  let step = 0;
  STEPS.forEach((candidate, index) => {
    if (elapsedSeconds >= candidate.fromSeconds) step = index;
  });
  return step;
}

interface AnalysisModalProps {
  open: boolean;
  error: string | null;
  inParts: boolean;
  firstPages: number | null;
  onCancel: () => void;
  onClose: () => void;
}

// Os passos acompanham o tempo de leitura; o fim de verdade vem do servidor (a tarefa termina ou falha).
export function AnalysisModal({ open, error, inParts, firstPages, onCancel, onClose }: AnalysisModalProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => { clearInterval(timer); setElapsed(0); };
  }, [open]);

  if (!open && !error) return null;
  const step = currentStep(elapsed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-label="Analisando com IA">
      <div className="relative w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-8 text-center shadow-2xl">
        <button type="button" onClick={error ? onClose : onCancel} aria-label="Fechar" className="absolute right-4 top-4 rounded p-1 text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500">
          <Sparkles className="h-8 w-8 text-white" />
        </div>

        {error ? (
          <>
            <h2 className="mb-2 text-lg font-bold text-white">Não foi possível analisar</h2>
            <p className="mb-6 text-sm text-red-300">{error}</p>
            <button type="button" onClick={onClose} className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
              Entendi
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-white">Analisando com IA...</h2>
            <p className="mb-1 mt-1 text-sm text-gray-400">Isso pode levar alguns minutos. Pode deixar esta tela aberta.</p>
            {inParts && (
              <p className="mb-4 text-xs text-amber-400">
                Documento grande: lendo primeiro as {firstPages ?? 50} primeiras páginas. O restante é lido em seguida, sozinho.
              </p>
            )}
            <ol className="mx-auto mb-6 mt-5 max-w-xs space-y-3 text-left">
              {STEPS.map((item, index) => {
                const done = index < step;
                const active = index === step;
                return (
                  <li key={item.label} className={`flex items-center gap-3 text-sm ${active ? 'font-semibold text-white' : done ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${active ? 'bg-blue-500 text-white' : done ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                      {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : index + 1}
                    </span>
                    {item.label}
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={onCancel} className="text-sm text-gray-400 hover:text-white">
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
