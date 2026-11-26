import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Zap, Sparkles, Flame, HelpCircle } from 'lucide-react';

import { XP_EVENT } from '../announce-xp';
import { xpService } from '../services/xp.service';
import { TierBadge } from './TierBadge';

const SOURCE_LABELS: Record<string, string> = {
  QUESTION: 'Questões Respondidas',
  FLASHCARD: 'Flashcards Revisados',
  GAME: 'Jogos Educativos',
  REVIEW: 'Revisões Agendadas',
  DOUBT: 'Dúvidas e Mentor',
  ROOM: 'Salas de Estudo',
};

const QUERY_KEY = ['xp-summary'];
const REFRESH_MS = 60_000;

// Nível, faixa e XP do dia: visualização gamificada de progresso e recompensas
export function XpCard() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: QUERY_KEY, queryFn: xpService.get, refetchInterval: REFRESH_MS });

  useEffect(() => {
    const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    window.addEventListener(XP_EVENT, refresh);
    return () => window.removeEventListener(XP_EVENT, refresh);
  }, [queryClient]);

  if (!data) return null;
  const { level, today, multiplier } = data;
  const percent = Math.min(100, Math.max(0, Math.round(level.progress * 100)));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 motion-safe:animate-in motion-safe:fade-in duration-normal">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          </span>
          Nível & Experiência
        </h2>
        <TierBadge level={level.level} tier={level.tier.name} />
      </div>

      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-extrabold tracking-tight tabular-nums text-gray-900 dark:text-white">
          {data.totalXp.toLocaleString('pt-BR')} <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">XP</span>
        </p>
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          {percent}%
        </span>
      </div>

      {/* Progress Bar with Doherty Threshold continuous feedback */}
      <div
        className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso para o próximo nível"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-slow ease-standard shadow-xs"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
        {level.maxed ? (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Nível máximo alcançado!</span>
        ) : (
          <>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{level.xpIntoLevel}</span> de{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{level.xpForNext} XP</span> para o Nível {level.level + 1}
          </>
        )}
      </p>

      {/* Daily XP and Streaks Footer */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Hoje: <strong className="font-bold text-gray-900 dark:text-white">{today.total}</strong> / {today.cap} XP
        </span>
        {multiplier > 1 && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60"
            title="Bônus de sequência ativa em questões e flashcards"
          >
            <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
            {multiplier.toLocaleString('pt-BR')}× ofensiva
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-h-[44px] sm:min-h-[32px] inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors touch-manipulation active:scale-95"
        >
          {open ? 'Ocultar' : 'Detalhes'}
          <ChevronDown className={`h-4 w-4 transition-transform duration-normal ease-standard ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="mt-2.5 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40 motion-safe:animate-in motion-safe:fade-in duration-fast">
          <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
            {Object.entries(today.bySource).map(([source, { earned, cap }]) => (
              <li key={source} className="flex items-center justify-between">
                <span>{SOURCE_LABELS[source] ?? source}</span>
                <span className="tabular-nums font-semibold text-gray-800 dark:text-gray-200">
                  {earned} / {cap} XP
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2.5 flex items-start gap-1.5 border-t border-gray-200/60 pt-2 text-[11px] text-gray-500 dark:border-gray-700/60 dark:text-gray-400">
            <HelpCircle className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />
            <span>Cada modalidade tem um teto diário pedagógico. Erros em questões não pontuam.</span>
          </div>
        </div>
      )}
    </div>
  );
}
