import { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, Circle, BookOpen, ListChecks, ShieldCheck, Shuffle } from 'lucide-react';

interface Stage {
  icon: typeof BookOpen;
  title: (q: number) => string;
  desc: string;
}

const STAGES: Stage[] = [
  { icon: BookOpen, title: () => 'Lendo o conteúdo', desc: 'Separando os pontos que valem virar questão' },
  { icon: ListChecks, title: (q) => `Elaborando ${q} questões`, desc: 'Múltipla escolha, 5 alternativas, com gabarito e explicação' },
  { icon: ShieldCheck, title: () => 'Conferindo os gabaritos', desc: 'Um segundo modelo resolve cada questão às cegas' },
  { icon: Shuffle, title: () => 'Montando o seu treino', desc: 'Embaralhando as alternativas e organizando' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950">
            <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
          </div>
        </div>

        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
          <span className="text-gray-500 dark:text-gray-400">cerca de {remaining}s restantes</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div className="h-full rounded-full bg-primary-600 transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
        {subjectName && (
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">{subjectName}</p>
        )}

        <div className="mt-5 space-y-3">
          {STAGES.map((stage, i) => {
            const state = i < activeStage ? 'done' : i === activeStage ? 'active' : 'pending';
            return (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0">
                  {state === 'done' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : state === 'active' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                  )}
                </span>
                <div className={state === 'pending' ? 'opacity-50' : ''}>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{stage.title(quantity)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-gray-400">
          Questão difícil leva mais tempo: o enunciado é mais longo e cada gabarito passa por uma
          segunda conferência antes de chegar até você.
        </p>
      </div>
    </div>
  );
}
