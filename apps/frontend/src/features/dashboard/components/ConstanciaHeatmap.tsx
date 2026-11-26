import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Maximize2, Shield } from 'lucide-react';

import type { HeatmapDay, StreakSummary } from '../services/dashboard.service';
import { ConstanciaModal } from './ConstanciaModal';
import { ConstanciaMonth, monthTitle } from './ConstanciaMonth';

// O backend envia cerca de 6 meses de histórico, então não adianta navegar mais para trás.
const MAX_MONTHS_BACK = 6;
const SHIELD_EVERY_DAYS = 7;
const MAX_SHIELDS = 2;

function daysToNextShield(streak: StreakSummary): number | null {
  if (streak.shields >= MAX_SHIELDS) return null;
  return SHIELD_EVERY_DAYS - (streak.current % SHIELD_EVERY_DAYS);
}

export function ConstanciaHeatmap({ heatmap, streak }: { heatmap: HeatmapDay[]; streak: StreakSummary }) {
  const [monthsBack, setMonthsBack] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const today = useMemo(() => new Date(), []);
  const counts = useMemo(() => new Map(heatmap.map((h) => [h.date, h.count])), [heatmap]);
  const shielded = useMemo(() => new Set(streak.shieldedDates), [streak.shieldedDates]);

  const shown = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
  const untilShield = daysToNextShield(streak);

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all duration-fast">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          Constância & Ofensiva
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Ampliar constância"
            title="Ver todos os meses"
            className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/60" title="Escudos protegem a sequência quando você falta um dia">
            <Shield className="h-3.5 w-3.5" />
            {streak.shields}
          </span>
          <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
            <Flame className="h-3.5 w-3.5 fill-current" />
            {streak.current} dia{streak.current === 1 ? '' : 's'}
          </span>
          <span className="text-gray-400 font-medium">recorde: {streak.longest}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <ConstanciaMonth
            year={shown.getFullYear()}
            month={shown.getMonth()}
            counts={counts}
            shielded={shielded}
            today={today}
          />
          <div className="mt-3.5 flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => setMonthsBack((m) => Math.min(MAX_MONTHS_BACK, m + 1))}
              disabled={monthsBack >= MAX_MONTHS_BACK}
              aria-label="Mês anterior"
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800 touch-manipulation cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-36 text-center font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
              {monthTitle(shown.getFullYear(), shown.getMonth())}
            </span>
            <button
              type="button"
              onClick={() => setMonthsBack((m) => Math.max(0, m - 1))}
              disabled={monthsBack === 0}
              aria-label="Próximo mês"
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800 touch-manipulation cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="border-t border-gray-100 pt-3 text-center text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {untilShield !== null
            ? `Faltam ${untilShield} dia${untilShield === 1 ? '' : 's'} para o próximo escudo de proteção`
            : 'Você está com o limite máximo de escudos ativos'}
        </p>
      </div>

      {expanded && (
        <ConstanciaModal counts={counts} shielded={shielded} today={today} streak={streak} onClose={() => setExpanded(false)} />
      )}
    </div>
  );
}
