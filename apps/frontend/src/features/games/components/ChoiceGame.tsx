import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Flame, Lightbulb, Loader2 } from 'lucide-react';
import { gameService, type GameAnswer, type GameResult, type Round } from '../services/game.service';
import { ResultPanel } from './ResultPanel';

type ChoiceMode = 'DUELO' | 'TRILHA' | 'PONTA';

const DUELO_SECONDS = 20;
const TIMEOUT_CHOICE = '-';

interface Feedback {
  choice: string;
  correct: boolean;
  answer: string;
}

export function ChoiceGame({
  round,
  mode,
  onAgain,
  onExit,
}: {
  round: Round;
  mode: ChoiceMode;
  onAgain: () => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [combo, setCombo] = useState(0);
  const [cues, setCues] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DUELO_SECONDS);
  const [result, setResult] = useState<GameResult | null>(null);
  const shownAt = useRef(Date.now());

  const item = round.items[index];
  const isLast = index === round.items.length - 1;

  const choose = useMutation({
    mutationFn: (choice: string) => gameService.check(round.roundId, item.id, choice),
    onSuccess: (res, choice) => {
      setFeedback({ choice, ...res });
      setCombo((c) => (res.correct ? c + 1 : 0));
      setAnswers((prev) => [
        ...prev,
        { itemId: item.id, choice, ms: Date.now() - shownAt.current, cues: mode === 'PONTA' ? cues : undefined },
      ]);
    },
  });

  const finish = useMutation({
    mutationFn: () => gameService.finish(round.roundId, answers),
    onSuccess: setResult,
  });

  useEffect(() => {
    if (mode !== 'DUELO' || feedback) return;
    const timer = setInterval(() => {
      const left = DUELO_SECONDS - (Date.now() - shownAt.current) / 1000;
      if (left <= 0) {
        clearInterval(timer);
        choose.mutate(TIMEOUT_CHOICE);
      } else {
        setTimeLeft(left);
      }
    }, 200);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, feedback, mode]);

  const next = () => {
    setIndex((i) => i + 1);
    setFeedback(null);
    setCues(0);
    setTimeLeft(DUELO_SECONDS);
    shownAt.current = Date.now();
  };

  if (result) {
    return (
      <ResultPanel
        result={result}
        passLabel={mode === 'TRILHA' && result.passed ? 'Território conquistado!' : undefined}
        onAgain={onAgain}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {index + 1} / {round.items.length}
        </span>
        {mode === 'DUELO' && (
          <span className="flex items-center gap-3">
            {combo >= 2 && (
              <span className="flex items-center gap-1 font-semibold text-amber-500">
                <Flame className="h-4 w-4" /> x{Math.min(2, 1 + combo * 0.1).toFixed(1)}
              </span>
            )}
            <span className="font-mono">{Math.ceil(timeLeft)}s</span>
          </span>
        )}
      </div>
      {mode === 'DUELO' && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full bg-primary-600 transition-all"
            style={{ width: `${(timeLeft / DUELO_SECONDS) * 100}%` }}
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="whitespace-pre-line text-gray-900 dark:text-white">{item.prompt}</p>

        {mode === 'PONTA' && item.hints && (
          <div className="mt-3 space-y-1">
            {item.hints.slice(0, cues).map((hint, i) => (
              <p
                key={i}
                className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
              >
                {hint}
              </p>
            ))}
            {!feedback && cues < item.hints.length && (
              <button
                onClick={() => setCues((c) => c + 1)}
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                <Lightbulb className="h-4 w-4" /> Pedir dica (vale menos pontos)
              </button>
            )}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {item.options.map((opt) => {
            const isAnswer = feedback?.answer === opt.key;
            const isWrongPick = feedback?.choice === opt.key && !feedback.correct;
            const style = isAnswer
              ? 'border-green-500 bg-green-50 dark:bg-green-950'
              : isWrongPick
                ? 'border-red-500 bg-red-50 dark:bg-red-950'
                : 'border-gray-200 hover:border-primary-300 dark:border-gray-700';
            return (
              <button
                key={opt.key}
                disabled={!!feedback || choose.isPending}
                onClick={() => choose.mutate(opt.key)}
                className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm text-gray-800 transition-colors dark:text-gray-200 ${style}`}
              >
                {opt.key.length <= 2 && <span className="mr-2 font-semibold">{opt.key}</span>}
                {opt.text}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className="mt-4 flex items-center justify-between">
            <p className={`text-sm font-semibold ${feedback.correct ? 'text-green-600' : 'text-red-500'}`}>
              {feedback.correct ? 'Correto!' : 'Não foi dessa vez. Veja a resposta marcada.'}
            </p>
            {isLast ? (
              <button
                onClick={() => finish.mutate()}
                disabled={finish.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {finish.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Ver resultado
              </button>
            ) : (
              <button
                onClick={next}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Próxima
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
