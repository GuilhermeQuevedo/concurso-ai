import { memo } from 'react';
import { Flame, Share2 } from 'lucide-react';

export interface MapActionToolbarProps {
  readonly weakPointsCount: number;
  readonly onOpenWeakPoints: () => void;
  readonly onOpenExport: () => void;
}

/**
 * Barra de Ações Rápidas do Mapa de Revisão.
 *
 * Fornece acesso direto e proeminente a:
 * 1. "Revisar Pontos Fracos" (com badge de tópicos em risco crítico).
 * 2. "Exportar / Compartilhar" (diálogo com PNG, Markdown e Link LGPD).
 */
export const MapActionToolbar = memo(function MapActionToolbar({
  weakPointsCount,
  onOpenWeakPoints,
  onOpenExport,
}: MapActionToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Botão Pontos Fracos */}
      <button
        type="button"
        onClick={onOpenWeakPoints}
        aria-label={`Revisar ${weakPointsCount} pontos fracos do edital`}
        className="group relative flex items-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-100/80 hover:border-rose-300 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70 transition-all cursor-pointer"
      >
        <Flame className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
        <span>Pontos Fracos</span>
        {weakPointsCount > 0 && (
          <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {weakPointsCount}
          </span>
        )}
      </button>

      {/* Botão Exportar e Compartilhar */}
      <button
        type="button"
        onClick={onOpenExport}
        aria-label="Exportar imagem, resumo ou link do mapa"
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 dark:hover:text-white transition-all cursor-pointer"
      >
        <Share2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
        <span>Exportar</span>
      </button>
    </div>
  );
});
