import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Zap } from 'lucide-react';

import { XP_EVENT } from '../announce-xp';
import { xpService } from '../services/xp.service';
import { TierBadge } from './TierBadge';

const SOURCE_LABELS: Record<string, string> = {
  QUESTION: 'Questões',
  FLASHCARD: 'Flashcards',
  GAME: 'Jogos',
  REVIEW: 'Revisões',
  DOUBT: 'Dúvidas',
  ROOM: 'Salas',
};

const QUERY_KEY = ['xp-summary'];
const REFRESH_MS = 60_000;

// Nível, faixa e XP do dia: o jeito de ver o quanto falta para a próxima recompensa.
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
  const percent = Math.round(level.progress * 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Zap className="h-4 w-4 text-amber-500" /> Seu nível
        </h2>
        <TierBadge level={level.level} tier={level.tier.name} />
      </div>

      <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
        {data.totalXp.toLocaleString('pt-BR')} <span className="text-sm font-medium text-gray-500">XP</span>
      </p>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso para o próximo nível"
      >
        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {level.maxed ? 'Nível máximo alcançado!' : `${level.xpIntoLevel}/${level.xpForNext} XP para o nível ${level.level + 1}`}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
        <span className="text-gray-600 dark:text-gray-300">
          Hoje: <strong>{today.total}</strong>/{today.cap} XP
        </span>
        {multiplier > 1 && (
          <span
            className="rounded-full bg-orange-100 px-2 py-0.5 font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300"
            title="Bônus da ofensiva em questões e flashcards"
          >
            {multiplier.toLocaleString('pt-BR')}× ofensiva
          </span>
        )}
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex items-center gap-0.5 font-medium text-primary-600 hover:underline">
          Detalhes <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
          {Object.entries(today.bySource).map(([source, { earned, cap }]) => (
            <li key={source} className="flex justify-between">
              <span>{SOURCE_LABELS[source] ?? source}</span>
              <span className="tabular-nums">
                {earned}/{cap}
              </span>
            </li>
          ))}
          <li className="pt-1 text-[11px] text-gray-400">Cada tipo de estudo tem um teto diário, e o total do dia é {today.cap} XP. Errar não pontua.</li>
        </ul>
      )}
    </div>
  );
}
