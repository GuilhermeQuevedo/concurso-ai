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

function optionClass(letter: string, q: RoomQuestion, canAnswer: boolean): string {
  const base = 'flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors';
  if (q.reveal) {
    if (letter === q.reveal.correctAnswer) return `${base} border-green-500 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-200`;
    if (letter === q.myChoice) return `${base} border-red-500 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200`;
    return `${base} border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400`;
  }
  if (letter === q.myChoice) return `${base} border-primary-500 bg-primary-50 text-gray-900 dark:bg-primary-950/30 dark:text-white`;
  return `${base} border-gray-200 text-gray-800 dark:border-gray-700 dark:text-gray-200 ${canAnswer ? 'hover:border-primary-400' : ''}`;
}

export function RoomQuestionCard({ question, position, canAnswer, pending, onAnswer }: RoomQuestionCardProps) {
  const locked = !canAnswer || pending || question.myChoice !== null;
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{position}</p>
      <p className="mb-3 whitespace-pre-line text-sm text-gray-900 dark:text-white">{htmlToPlainText(question.statement)}</p>
      <ul className="space-y-1.5">
        {question.alternatives.map((alt) => (
          <li key={alt.letter}>
            <button type="button" disabled={locked} onClick={() => onAnswer(alt.letter)} className={optionClass(alt.letter, question, canAnswer)}>
              <strong>{alt.letter})</strong> <span>{alt.text}</span>
            </button>
          </li>
        ))}
      </ul>
      {question.myChoice && !question.reveal && <p className="mt-2 text-xs text-primary-600">Resposta enviada. Aguarde a revelação.</p>}
      {question.reveal && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
          <p>
            Gabarito: <strong>{question.reveal.correctAnswer}</strong>
            {question.myChoice === null && ' · você não respondeu'}
          </p>
          {question.reveal.explanation && <p className="mt-1 whitespace-pre-line">{htmlToPlainText(question.reveal.explanation)}</p>}
        </div>
      )}
    </article>
  );
}
