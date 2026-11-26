import { useEffect } from 'react';
import { Landmark, Sparkles, X } from 'lucide-react';

export type QuestionSource = 'ai' | 'bank';

interface QuestionSourceChooserProps {
  onChoose: (source: QuestionSource) => void;
  onClose: () => void;
}

interface SourceOption {
  source: QuestionSource;
  icon: typeof Sparkles;
  title: string;
  description: string;
  tag: string;
}

const SOURCE_OPTIONS: readonly SourceOption[] = [
  {
    source: 'ai',
    icon: Sparkles,
    title: 'Gerar com o motor IA das bancas',
    description: 'A IA cria questões inéditas no estilo da banca, a partir da matéria, de um PDF ou do seu texto.',
    tag: 'Inéditas, sob medida',
  },
  {
    source: 'bank',
    icon: Landmark,
    title: 'Questões diretamente das bancas',
    description: 'Monte um caderno com questões que já caíram em provas, filtrando por banca, ano, órgão e matéria.',
    tag: 'Provas reais',
  },
];

/**
 * Modal de escolha de fonte de questões com design Astryx e acessibilidade WCAG AA.
 */
export function QuestionSourceChooser({ onChoose, onClose }: QuestionSourceChooserProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="question-source-title"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all duration-fast"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 id="question-source-title" className="text-lg font-bold text-slate-900 dark:text-white">
              De onde vêm as questões?
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Escolha como deseja estruturar a sua sessão de treino.
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

        <div className="grid gap-3.5 sm:grid-cols-2">
          {SOURCE_OPTIONS.map(({ source, icon: Icon, title, description, tag }) => (
            <button
              key={source}
              type="button"
              onClick={() => onChoose(source)}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 text-left transition-all duration-fast ease-standard hover:border-[#2E8C82] hover:bg-[#2E8C82]/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-[#2E8C82] dark:hover:bg-[#2E8C82]/10 active:scale-[0.99] touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#52b3a8] transition-colors group-hover:bg-[#2E8C82] group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {title}
              </span>
              <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {description}
              </span>
              <span className="mt-auto rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {tag}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
