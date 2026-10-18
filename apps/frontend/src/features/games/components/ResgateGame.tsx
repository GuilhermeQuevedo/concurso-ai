import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, ShieldCheck } from 'lucide-react';
import { gameService, type GameAnswer, type GameResult, type Round } from '../services/game.service';
import { ResultPanel } from './ResultPanel';

function strengthColor(retention: number): string {
  if (retention < 0.4) return 'bg-red-500';
  if (retention < 0.7) return 'bg-amber-500';
  return 'bg-green-500';
}

export function ResgateGame({
  round,
  onAgain,
  onExit,
}: {
  round: Round;
  onAgain: () => void;
  onExit: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [rescued, setRescued] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);

  const open = round.items.find((i) => i.id === openId) ?? null;
  const allDone = Object.keys(rescued).length === round.items.length;

  const choose = useMutation({
    mutationFn: ({ itemId, choice }: { itemId: string; choice: string }) =>
      gameService.check(round.roundId, itemId, choice),
    onSuccess: (res, vars) => {
      setAnswers((prev) => [...prev, { itemId: vars.itemId, choice: vars.choice }]);
      setRescued((prev) => ({ ...prev, [vars.itemId]: res.correct }));
      setOpenId(null);
    },
  });

  const finish = useMutation({
    mutationFn: () => gameService.finish(round.roundId, answers),
    onSuccess: setResult,
  });

  if (result) {
    return <ResultPanel result={result} passLabel="Memórias resgatadas!" onAgain={onAgain} onExit={onExit} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
        Estes conteúdos estão sendo esquecidos. Resgate primeiro os mais fracos: quanto menor a força, mais pontos.
      </p>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Cada resgate também reagenda a sua revisão no flashcard.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {round.items.map((item) => {
          const retention = item.retention ?? 0;
          const state = rescued[item.id];
          return (
            <button
              key={item.id}
              disabled={state !== undefined || choose.isPending}
              onClick={() => setOpenId(item.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                state === undefined
                  ? 'border-gray-200 bg-white hover:border-primary-300 dark:border-gray-800 dark:bg-gray-900'
                  : state
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-red-400 bg-red-50 dark:bg-red-950'
              }`}
            >
              <p className="mb-3 text-sm text-gray-900 dark:text-white">{item.prompt}</p>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full ${state ? 'bg-green-500' : strengthColor(retention)}`}
                  style={{ width: `${state ? 100 : Math.max(4, Math.round(retention * 100))}%` }}
                />
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                {state ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Resgatado
                  </>
                ) : (
                  `Força da memória: ${Math.round(retention * 100)}%`
                )}
              </p>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpenId(null)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 font-medium text-gray-900 dark:text-white">{open.prompt}</p>
            <div className="space-y-2">
              {open.options.map((opt) => (
                <button
                  key={opt.key}
                  disabled={choose.isPending}
                  onClick={() => choose.mutate({ itemId: open.id, choice: opt.key })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm text-gray-800 hover:border-primary-300 dark:border-gray-700 dark:text-gray-200"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {allDone && (
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
