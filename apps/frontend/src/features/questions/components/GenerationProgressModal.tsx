import { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, Circle, BookOpen, ListChecks, ShieldCheck, Shuffle, Sparkles } from 'lucide-react';

interface Stage {
  icon: typeof BookOpen;
  title: (q: number) => string;
  desc: string;
}

const STAGES: Stage[] = [
  { icon: BookOpen, title: () => 'Lendo o conteúdo', desc: 'Separando os pontos chave que valem virar questão' },
  { icon: ListChecks, title: (q) => `Elaborando ${q} questões`, desc: 'Enunciados contextualizados, 5 alternativas e justificativas didáticas' },
  { icon: ShieldCheck, title: () => 'Conferindo os gabaritos', desc: 'Um segundo modelo de IA resolve cada questão às cegas para blindagem' },
  { icon: Shuffle, title: () => 'Montando o seu treino', desc: 'Embaralhando alternativas e organizando a sequência pedagógica' },
];

const MAX_PROGRESS = 93;

function stageFromProgress(p: number): number {
  if (p < 18) return 0;
  if (p < 62) return 1;
  if (p < 84) return 2;
  return 3;
}

export function GenerationProgressModal({
  open,
  quantity,
  subjectName,
}: {
  open: boolean;
  quantity: number;
  subjectName?: string;
}) {
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }
    const estMs = 8000 + quantity * 2200;
    const step = MAX_PROGRESS / (estMs / 120);
    timer.current = window.setInterval(() => {
      setProgress((p) => Math.min(MAX_PROGRESS, p + step));
    }, 120);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [open, quantity]);

  if (!open) return null;

  const activeStage = stageFromProgress(progress);
  const remaining = Math.max(1, Math.ceil(((MAX_PROGRESS - progress) / MAX_PROGRESS) * ((8000 + quantity * 2200) / 1000)));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="generation-title"
      aria-describedby="generation-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-normal"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in fade-in zoom-in-95 duration-slow ease-standard">
        <div className="mb-5 flex justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950/60 shadow-xs">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-primary-500 animate-pulse" />
          </div>
        </div>

        <h3 id="generation-title" className="text-center font-bold text-lg text-gray-900 dark:text-white">
          Gerando Simulado Inteligente
        </h3>
        {subjectName && (
          <p className="mt-0.5 text-center text-xs font-medium text-primary-600 dark:text-primary-400">
            {subjectName}
          </p>
        )}

        <div className="mt-5 mb-1.5 flex items-center justify-between text-xs font-medium">
          <span className="font-bold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
          <span className="text-gray-500 dark:text-gray-400">cerca de {remaining}s restantes</span>
        </div>

        {/* Progress Bar (Limiar de Doherty / Feedback contínuo) */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-full rounded-full bg-primary-600 transition-all duration-normal ease-standard dark:bg-primary-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stages List (Staging) */}
        <div className="mt-6 space-y-3.5">
          {STAGES.map((stage, i) => {
            const state = i < activeStage ? 'done' : i === activeStage ? 'active' : 'pending';
            return (
              <div
                key={i}
                className={`flex items-start gap-3 transition-opacity duration-fast ${
                  state === 'pending' ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {state === 'done' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : state === 'active' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary-600 dark:text-primary-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 dark:text-gray-700" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                    {stage.title(quantity)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p id="generation-desc" className="mt-6 border-t border-gray-100 pt-3.5 text-center text-[11px] leading-relaxed text-gray-400 dark:border-gray-800 dark:text-gray-500">
          Questões com nível de concurso exigem enunciados aprofundados e dupla checagem de gabarito para evitar ambiguidades.
        </p>
      </div>
    </div>
  );
}
