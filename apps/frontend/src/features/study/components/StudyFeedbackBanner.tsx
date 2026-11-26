import { useState } from 'react';
import { Check, XCircle, ChevronDown, Sparkles } from 'lucide-react';
import { GroupDoubtButton } from '@/features/groups/components/GroupDoubtButton';
import { RichExplanationView } from './RichExplanationView';

export interface StudyFeedbackBannerProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  questionContext?: string;
  targetId?: string;
}

export function StudyFeedbackBanner({
  isCorrect,
  correctAnswer,
  explanation,
  questionContext,
  targetId,
}: StudyFeedbackBannerProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const bannerTheme = isCorrect
    ? {
        border: 'border-emerald-300 dark:border-emerald-800',
        bg: 'bg-emerald-50/90 dark:bg-emerald-950/60',
        text: 'text-emerald-950 dark:text-emerald-100',
        badge: 'bg-emerald-600',
        title: 'Parabéns, você acertou!',
      }
    : {
        border: 'border-red-300 dark:border-red-800',
        bg: 'bg-red-50/90 dark:bg-red-950/60',
        text: 'text-red-950 dark:text-red-100',
        badge: 'bg-red-600',
        title: 'Você errou esta questão.',
      };

  return (
    <section aria-label="Resultado da questão" className="mt-6 space-y-4 animate-in fade-in duration-fast">
      {/* Banner de Resultado Imediato (Feedback & Staging) */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border p-4.5 shadow-xs transition-all duration-fast ${bannerTheme.border} ${bannerTheme.bg} ${bannerTheme.text}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs ${bannerTheme.badge}`}
          >
            {isCorrect ? (
              <Check className="h-6 w-6 stroke-[3]" />
            ) : (
              <XCircle className="h-6 w-6 stroke-[3]" />
            )}
          </div>
          <div>
            <h4 className="text-base font-bold leading-tight">{bannerTheme.title}</h4>
            <p className="mt-0.5 text-xs opacity-90 font-medium">
              Gabarito oficial: <strong>Alternativa {correctAnswer}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowExplanation((prev) => !prev)}
            aria-expanded={showExplanation}
            className="min-h-[44px] sm:min-h-[34px] inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold underline transition-all duration-fast hover:opacity-85 touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{showExplanation ? 'Ocultar Explicação' : 'Ver Explicação'}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-fast ease-standard ${
                showExplanation ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {targetId && questionContext && (
        <div className="flex justify-end">
          <GroupDoubtButton targetType="QUESTION" targetId={targetId} context={questionContext} />
        </div>
      )}

      {/* Explicação Pedagógica da Banca (Expansão Didática) */}
      {showExplanation && (
        <div className="animate-in fade-in duration-fast">
          <RichExplanationView
            explanation={explanation || 'Sem comentário cadastrado para esta questão.'}
            correctAnswer={correctAnswer}
          />
        </div>
      )}
    </section>
  );
}
