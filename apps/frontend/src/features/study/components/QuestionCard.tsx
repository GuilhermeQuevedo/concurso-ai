import { Star, CheckCircle2, Loader2 } from 'lucide-react';
import type { QuestionDTO } from '@/features/questions/services/question.service';
import { htmlToPlainText } from '@/lib/html';
import { QuestionAlternative, type AlternativeState } from './QuestionAlternative';

export type QuestionFormat = 'MULTIPLE' | 'TRUE_FALSE' | 'ESSAY';

export interface QuestionCardProps {
  question: QuestionDTO;
  index: number;
  total: number;
  format: QuestionFormat;
  selectedAnswer: string | null;
  isAnswered: boolean;
  showFeedback: boolean;
  isFavorited: boolean;
  isSubmitting: boolean;
  mode: 'STUDY' | 'EXAM';
  onSelectAlternative: (letter: string) => void;
  onConfirmAnswer: () => void;
  onToggleFavorite: () => void;
  children?: React.ReactNode;
}

const FORMAT_LABEL: Record<QuestionFormat, string> = {
  MULTIPLE: 'Múltipla escolha',
  TRUE_FALSE: 'Certo ou errado',
  ESSAY: 'Subjetiva',
};

export function QuestionCard({
  question,
  index,
  total,
  format,
  selectedAnswer,
  isAnswered,
  showFeedback,
  isFavorited,
  isSubmitting,
  mode,
  onSelectAlternative,
  onConfirmAnswer,
  onToggleFavorite,
  children,
}: QuestionCardProps) {
  const getAlternativeState = (letter: string): AlternativeState => {
    if (showFeedback) {
      if (letter === question.correctAnswer) return 'correct';
      if (letter === selectedAnswer) return 'wrong';
      return 'muted';
    }
    if (isAnswered) {
      return letter === selectedAnswer ? 'selected' : 'muted';
    }
    return letter === selectedAnswer ? 'selected' : 'idle';
  };

  return (
    <article
      className="mx-auto max-w-2xl rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-7 shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all duration-fast"
      aria-label={`Questão ${index + 1}`}
    >
      {/* Top Metadata Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5 border-b border-gray-100 pb-3.5 dark:border-gray-850">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-primary-600/10 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-600/20">
            Questão {index + 1} de {total}
          </span>
          <span className="rounded-lg bg-gray-100 border border-gray-200/60 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
            {FORMAT_LABEL[format]}
          </span>
          {question.source && (
            <span className="hidden sm:inline-block rounded-lg bg-gray-50 border border-gray-200/50 px-2 py-1 text-[11px] font-medium text-gray-500 dark:bg-gray-850 dark:border-gray-800 dark:text-gray-400">
              {question.source}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Favoritar questão'}
          className={`min-h-[44px] sm:min-h-[32px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-all duration-fast ease-standard touch-manipulation cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
            isFavorited
              ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-xs dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
              : 'border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/30 dark:border-gray-800 dark:text-gray-400 dark:hover:border-amber-700 dark:hover:text-amber-400'
          }`}
        >
          <Star className="h-3.5 w-3.5" fill={isFavorited ? 'currentColor' : 'none'} />
          <span>{isFavorited ? 'Favoritada' : 'Favoritar'}</span>
        </button>
      </div>

      {/* Statement */}
      <p className="mb-6 whitespace-pre-line text-base font-normal leading-relaxed text-gray-900 dark:text-gray-100">
        {htmlToPlainText(question.statement)}
      </p>

      {/* Alternatives List / Essay Content */}
      {format === 'ESSAY' ? (
        children
      ) : (
        <>
          <div className="space-y-3" role="radiogroup" aria-label="Alternativas">
            {question.alternatives.map((alt) => (
              <QuestionAlternative
                key={alt.letter}
                letter={alt.letter}
                text={alt.text}
                state={getAlternativeState(alt.letter)}
                disabled={isAnswered || isSubmitting}
                onClick={() => onSelectAlternative(alt.letter)}
              />
            ))}
          </div>

          {/* Primary Action Button (Fitts' Law: Large 48px touch target right under alternatives) */}
          {!isAnswered && (
            <div className="mt-6">
              <button
                type="button"
                onClick={onConfirmAnswer}
                disabled={!selectedAnswer || isSubmitting}
                aria-busy={isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 font-bold text-sm sm:text-base text-white shadow-sm transition-all duration-fast ease-standard hover:bg-primary-700 hover:shadow-md active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-primary-600 disabled:hover:shadow-none cursor-pointer disabled:cursor-not-allowed touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Conferindo com a banca...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{mode === 'EXAM' ? 'Confirmar Resposta' : 'Responder e Ver Resposta'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
