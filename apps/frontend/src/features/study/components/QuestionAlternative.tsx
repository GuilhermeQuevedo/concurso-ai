import { Check, XCircle } from 'lucide-react';
import { htmlToPlainText } from '@/lib/html';

export type AlternativeState = 'idle' | 'selected' | 'correct' | 'wrong' | 'muted';

export interface QuestionAlternativeProps {
  letter: string;
  text: string;
  state: AlternativeState;
  disabled?: boolean;
  onClick: () => void;
}

export function QuestionAlternative({
  letter,
  text,
  state,
  disabled = false,
  onClick,
}: QuestionAlternativeProps) {
  // Mapeamento semântico de estados visuais com suporte a tokens Astryx e WCAG AA
  const stylesByState: Record<AlternativeState, { card: string; badge: string }> = {
    idle: {
      card: 'border-gray-200 bg-white hover:border-primary-400 hover:bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-600 dark:hover:bg-gray-850 text-gray-800 dark:text-gray-200',
      badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-semibold group-hover:bg-primary-50 group-hover:text-primary-700 dark:group-hover:bg-primary-950/80 dark:group-hover:text-primary-300',
    },
    selected: {
      card: 'border-primary-500 bg-primary-50/80 dark:bg-primary-950/40 text-primary-950 dark:text-primary-100 ring-2 ring-primary-500 shadow-xs font-medium',
      badge: 'bg-primary-600 text-white font-bold shadow-xs',
    },
    correct: {
      card: 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/80 shadow-xs',
      badge: 'bg-emerald-600 text-white font-bold shadow-xs',
    },
    wrong: {
      card: 'border-red-500 bg-red-50/90 dark:bg-red-950/50 text-red-950 dark:text-red-100 ring-2 ring-red-500/80 shadow-xs',
      badge: 'bg-red-600 text-white font-bold shadow-xs',
    },
    muted: {
      card: 'border-gray-200/60 bg-gray-50/50 dark:border-gray-850 dark:bg-gray-900/40 text-gray-400 dark:text-gray-500 opacity-60',
      badge: 'bg-gray-100/80 text-gray-400 dark:bg-gray-800/80 dark:text-gray-600',
    },
  };

  const { card: cardClass, badge: badgeClass } = stylesByState[state];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={state === 'selected' || state === 'correct'}
      disabled={disabled}
      onClick={onClick}
      className={`group flex w-full min-h-[48px] items-center gap-3.5 rounded-xl border p-4 text-left text-sm transition-all duration-fast ease-standard touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${cardClass} ${
        disabled ? 'cursor-default active:scale-100' : 'cursor-pointer active:scale-[0.99] hover:shadow-xs'
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs transition-all duration-fast ease-standard group-hover:scale-105 ${badgeClass}`}
      >
        {state === 'correct' ? (
          <Check className="h-4 w-4 stroke-[3]" />
        ) : state === 'wrong' ? (
          <XCircle className="h-4 w-4 stroke-[3]" />
        ) : (
          letter
        )}
      </span>
      <span className="flex-1 leading-relaxed text-sm sm:text-base font-normal">{htmlToPlainText(text)}</span>
    </button>
  );
}
