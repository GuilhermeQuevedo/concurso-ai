import { Check, XCircle, Loader2 } from 'lucide-react';
import { htmlToPlainText } from '@/lib/html';
import type { RoomQuestion } from '../services/room.service';

export interface RoomQuestionCardProps {
  question: RoomQuestion;
  position: string;
  // Pode escolher uma alternativa agora? (ao vivo: janela de resposta; próprio ritmo: ainda não respondeu)
  canAnswer: boolean;
  pending: boolean;
  onAnswer: (choice: string) => void;
}

export function RoomQuestionCard({
  question,
  position,
  canAnswer,
  pending,
  onAnswer,
}: RoomQuestionCardProps) {
  const locked = !canAnswer || pending || question.myChoice !== null;

  const getOptionState = (letter: string) => {
    if (question.reveal) {
      if (letter === question.reveal.correctAnswer) return 'correct';
      if (letter === question.myChoice) return 'wrong';
      return 'muted';
    }
    if (letter === question.myChoice) return 'selected';
    return 'idle';
  };

  const getOptionStyles = (state: string) => {
    switch (state) {
      case 'correct':
        return {
          card: 'border-emerald-500 bg-emerald-50/90 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100 ring-1 ring-emerald-500',
          badge: 'bg-emerald-600 text-white font-bold',
        };
      case 'wrong':
        return {
          card: 'border-red-500 bg-red-50/90 text-red-950 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100 ring-1 ring-red-500',
          badge: 'bg-red-600 text-white font-bold',
        };
      case 'selected':
        return {
          card: 'border-primary-500 bg-primary-50 text-gray-900 dark:border-primary-700 dark:bg-primary-950/40 dark:text-white ring-2 ring-primary-500/80',
          badge: 'bg-primary-600 text-white font-bold',
        };
      case 'muted':
        return {
          card: 'border-gray-200 text-gray-400 dark:border-gray-800 dark:text-gray-500 opacity-60',
          badge: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600',
        };
      default:
        return {
          card: 'border-gray-200 text-gray-800 hover:border-primary-400 hover:bg-gray-50/50 dark:border-gray-700 dark:text-gray-200 dark:hover:border-primary-500 dark:hover:bg-gray-850',
          badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-semibold',
        };
    }
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all duration-normal dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="rounded-md bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
          {position}
        </span>
        {pending && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            Enviando...
          </span>
        )}
      </div>

      <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-gray-900 dark:text-white">
        {htmlToPlainText(question.statement)}
      </p>

      <ul className="space-y-2" role="radiogroup" aria-label="Alternativas da rodada">
        {question.alternatives.map((alt) => {
          const state = getOptionState(alt.letter);
          const { card, badge } = getOptionStyles(state);

          return (
            <li key={alt.letter}>
              <button
                type="button"
                role="radio"
                aria-checked={state === 'selected' || state === 'correct'}
                disabled={locked}
                onClick={() => onAnswer(alt.letter)}
                className={`flex w-full min-h-[44px] items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-all duration-fast ease-standard touch-manipulation cursor-pointer ${card} ${
                  locked ? 'cursor-default active:scale-100' : 'active:scale-[0.99]'
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${badge}`}>
                  {state === 'correct' ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : state === 'wrong' ? (
                    <XCircle className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    alt.letter
                  )}
                </span>
                <span className="flex-1 leading-snug">{alt.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {question.myChoice && !question.reveal && (
        <p className="mt-3 text-xs font-medium text-primary-600 dark:text-primary-400">
          Resposta enviada com sucesso! Aguarde a revelação do gabarito.
        </p>
      )}

      {question.reveal && (
        <div className="mt-4 rounded-xl border border-gray-200/80 bg-gray-50/80 p-3.5 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-850/60 dark:text-gray-300">
          <p className="font-semibold">
            Gabarito oficial: <strong className="text-emerald-600 dark:text-emerald-400">Alternativa {question.reveal.correctAnswer}</strong>
            {question.myChoice === null && ' · você não respondeu no tempo limite'}
          </p>
          {question.reveal.explanation && (
            <p className="mt-1.5 whitespace-pre-line leading-relaxed text-muted-foreground">
              {htmlToPlainText(question.reveal.explanation)}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
