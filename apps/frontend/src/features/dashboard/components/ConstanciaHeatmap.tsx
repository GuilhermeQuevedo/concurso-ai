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
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          Constância
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Ampliar constância"
            title="Ver todos os meses"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400" title="Escudos protegem a sequência quando você falta um dia">
            <Shield className="h-4 w-4" />
            {streak.shields}
          </span>
          <span className="flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400">
            <Flame className="h-4 w-4" />
            {streak.current} dia{streak.current === 1 ? '' : 's'}
          </span>
          <span className="text-gray-400">recorde: {streak.longest}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,26rem)_1fr]">
        <div>
          <ConstanciaMonth
            year={shown.getFullYear()}
            month={shown.getMonth()}
            counts={counts}
            shielded={shielded}
            today={today}
          />
          <div className="mt-3 flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => setMonthsBack((m) => Math.min(MAX_MONTHS_BACK, m + 1))}
              disabled={monthsBack >= MAX_MONTHS_BACK}
              aria-label="Mês anterior"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-36 text-center font-medium text-gray-800 dark:text-gray-200">
              {monthTitle(shown.getFullYear(), shown.getMonth())}
            </span>
            <button
              type="button"
              onClick={() => setMonthsBack((m) => Math.max(0, m - 1))}
              disabled={monthsBack === 0}
              aria-label="Próximo mês"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3 text-sm text-gray-600 dark:text-gray-300">
          <p className="flex items-start gap-2">
            <Flame className="mt-0.5 h-4 w-4 shrink-0 fill-orange-400 text-orange-500" />
            Estude todo dia para manter a sequência. Cada dia de estudo ganha um foguinho.
          </p>
          <p className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 fill-sky-400 text-sky-500" />
            <span>
              A cada {SHIELD_EVERY_DAYS} dias seguidos você ganha um escudo (até {MAX_SHIELDS}). Se faltar um dia, o escudo é usado
              automaticamente e a sequência não zera.
              {untilShield !== null && (
                <strong className="mt-1 block text-gray-800 dark:text-gray-100">
                  Faltam {untilShield} dia{untilShield === 1 ? '' : 's'} para o próximo escudo.
                </strong>
              )}
              {untilShield === null && <strong className="mt-1 block text-gray-800 dark:text-gray-100">Você está com o máximo de escudos.</strong>}
            </span>
          </p>
        </div>
      </div>

      {expanded && (
        <ConstanciaModal counts={counts} shielded={shielded} today={today} streak={streak} onClose={() => setExpanded(false)} />
      )}
    </div>
  );
}
