import { Trophy, RotateCcw, ArrowLeft } from 'lucide-react';
import type { GameResult } from '../services/game.service';

export interface ResultPanelProps {
  result: GameResult;
  passLabel?: string;
  onAgain: () => void;
  onExit: () => void;
}

export function ResultPanel({
  result,
  passLabel,
  onAgain,
  onExit,
}: ResultPanelProps) {
  return (
    <div
      role="region"
      aria-label="Resultado da rodada do jogo"
      className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:fade-in duration-fast"
    >
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-[#F2A93B] dark:bg-amber-500/20 dark:text-[#f7bf67]">
        <Trophy className="h-7 w-7" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
        {result.passed ? (passLabel ?? 'Excelente! Rodada concluída') : 'Rodada concluída'}
      </h2>

      <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
        {`${result.correct} de ${result.total} acertos`}
      </p>

      <p className="my-4 font-mono text-4xl font-extrabold text-[#2E8C82] dark:text-[#38b2a6]">
        {`+${result.points} XP`}
      </p>

      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
        Hoje: {result.earnedToday}/{result.dailyCap} pontos
      </p>

      {result.capReached && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 leading-relaxed">
          <strong>Limite diário de pontos alcançado:</strong> Continue praticando sem pressa. O benefício neural da retenção ativa é mais valioso que a pontuação.
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onAgain}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast shadow-xs touch-manipulation"
        >
          <RotateCcw className="h-4 w-4" /> Jogar de novo
        </button>
        <button
          type="button"
          onClick={onExit}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast touch-manipulation dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos jogos
        </button>
      </div>
    </div>
  );
}
