import { Landmark, Sparkles, X } from 'lucide-react';

export type QuestionSource = 'ai' | 'bank';

interface Props {
  onChoose: (source: QuestionSource) => void;
  onClose: () => void;
}

const OPTIONS = [
  {
    source: 'ai' as const,
    icon: Sparkles,
    title: 'Gerar com o motor IA das bancas',
    text: 'A IA cria questões inéditas no estilo da banca, a partir da matéria, de um PDF ou do seu texto.',
    tag: 'Inéditas, sob medida',
  },
  {
    source: 'bank' as const,
    icon: Landmark,
    title: 'Questões diretamente das bancas',
    text: 'Monte um caderno com questões que já caíram em provas, filtrando por banca, ano, órgão e matéria.',
    tag: 'Provas reais',
  },
];

export function QuestionSourceChooser({ onChoose, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-label="De onde vêm as questões?"
        className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">De onde vêm as questões?</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Escolha como montar o seu caderno.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map(({ source, icon: Icon, title, text, tag }) => (
            <button
              key={source}
              type="button"
              onClick={() => onChoose(source)}
              className="group flex flex-col items-start gap-3 rounded-xl border border-gray-200 p-5 text-left transition-all hover:border-primary-400 hover:bg-primary-50/40 dark:border-gray-700 dark:hover:bg-primary-950/20"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600 dark:text-primary-400">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-base font-bold text-gray-900 dark:text-white">{title}</span>
              <span className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{text}</span>
              <span className="mt-auto rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{tag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
