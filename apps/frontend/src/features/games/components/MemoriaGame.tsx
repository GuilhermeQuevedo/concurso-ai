import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { gameService, type GameAnswer, type GameResult, type Round } from '../services/game.service';
import { ResultPanel } from './ResultPanel';

function shuffled<T>(list: T[]): T[] {
  return [...list].sort(() => Math.random() - 0.5);
}

export function MemoriaGame({
  round,
  onAgain,
  onExit,
}: {
  round: Round;
  onAgain: () => void;
  onExit: () => void;
}) {
  const [pickedFront, setPickedFront] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongToken, setWrongToken] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<GameAnswer[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);

  const backs = useMemo(
    () => shuffled(round.items.map((i) => ({ itemId: i.id, token: i.options[0].key, text: i.options[0].text }))),
    [round],
  );
  const complete = matched.size === round.items.length;

  useEffect(() => {
    if (complete) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [complete]);

  const check = useMutation({
    mutationFn: ({ itemId, token }: { itemId: string; token: string }) =>
      gameService.check(round.roundId, itemId, token),
    onSuccess: (res, vars) => {
      setAttempts((prev) => [...prev, { a: vars.itemId, b: vars.token }]);
      if (res.correct) {
        setMatched((prev) => new Set(prev).add(vars.itemId));
      } else {
        setWrongToken(vars.token);
        setTimeout(() => setWrongToken(null), 600);
      }
      setPickedFront(null);
    },
  });

  const finish = useMutation({
    mutationFn: () => gameService.finish(round.roundId, attempts),
    onSuccess: setResult,
  });

  if (result) {
    return <ResultPanel result={result} passLabel="Todos os pares encontrados!" onAgain={onAgain} onExit={onExit} />;
  }

  const base = 'w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors';

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {matched.size} / {round.items.length} pares
        </span>
        <span className="font-mono">{seconds}s</span>
      </div>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Toque em um conceito e depois na definição que combina com ele.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {round.items.map((item) => {
            const done = matched.has(item.id);
            const active = pickedFront === item.id;
            return (
              <button
                key={item.id}
                disabled={done || check.isPending}
                onClick={() => setPickedFront(item.id)}
                className={`${base} ${
                  done
                    ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
                    : active
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                      : 'border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900'
                } text-gray-800 dark:text-gray-200`}
              >
                {item.prompt}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {backs.map((back) => {
            const done = matched.has(back.itemId);
            return (
              <button
                key={back.token}
                disabled={done || !pickedFront || check.isPending}
                onClick={() => pickedFront && check.mutate({ itemId: pickedFront, token: back.token })}
                className={`${base} ${
                  done
                    ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
                    : wrongToken === back.token
                      ? 'border-red-500 bg-red-50 dark:bg-red-950'
                      : 'border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900'
                } text-gray-800 dark:text-gray-200`}
              >
                {back.text}
              </button>
            );
          })}
        </div>
      </div>

      {complete && (
        <button
          onClick={() => finish.mutate()}
          disabled={finish.isPending}
          className="mt-5 flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {finish.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Ver resultado
        </button>
      )}
    </div>
  );
}
