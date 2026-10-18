import { Trophy, RotateCcw, ArrowLeft } from 'lucide-react';
import type { GameResult } from '../services/game.service';

export function ResultPanel({
  result,
  passLabel,
  onAgain,
  onExit,
}: {
  result: GameResult;
  passLabel?: string;
  onAgain: () => void;
  onExit: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
      <Trophy className="mx-auto mb-2 h-10 w-10 text-amber-500" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        {result.passed ? (passLabel ?? 'Boa! Rodada concluída') : 'Rodada concluída'}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {result.correct} de {result.total} corretos
      </p>
      <p className="my-4 text-4xl font-bold text-primary-600">+{result.points}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Hoje: {result.earnedToday}/{result.dailyCap} pontos
      </p>
      {result.capReached && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          Limite diário de pontos atingido. Continue praticando: o que importa é fixar o conteúdo, não acumular pontos.
        </p>
      )}
      <div className="mt-5 flex justify-center gap-2">
        <button
          onClick={onAgain}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <RotateCcw className="h-4 w-4" /> Jogar de novo
        </button>
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>
    </div>
  );
}
