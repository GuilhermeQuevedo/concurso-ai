import { memo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, AlertTriangle, List, Network } from 'lucide-react';

export interface ConstellationControlsProps {
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onFitGraph: () => void;
  readonly showUrgentOnly: boolean;
  readonly onToggleUrgentOnly: () => void;
  readonly isAccessibleView: boolean;
  readonly onToggleAccessibleView: () => void;
}

/**
 * Barra de Controles Flutuante da Constelação.
 * Permite controle de zoom, enquadramento espacial, alternância para lista acessível (WCAG AA)
 * e filtro rápido de tópicos com pendências urgentes de revisão.
 */
export const ConstellationControls = memo(function ConstellationControls({
  onZoomIn,
  onZoomOut,
  onFitGraph,
  showUrgentOnly,
  onToggleUrgentOnly,
  isAccessibleView,
  onToggleAccessibleView,
}: ConstellationControlsProps) {
  return (
    <nav
      aria-label="Controles de navegação e visualização do mapa"
      className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 select-none"
    >
      {/* Botão de Alternância para Lista Acessível (WCAG AA) */}
      <button
        type="button"
        onClick={onToggleAccessibleView}
        aria-pressed={isAccessibleView}
        aria-label={isAccessibleView ? 'Voltar para visão constelação visual' : 'Alternar para lista textual acessível (WCAG AA)'}
        title={isAccessibleView ? 'Alternar para constelação (grafo visual)' : 'Alternar para lista acessível (leitor de tela e teclado)'}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-md transition-all cursor-pointer ${
          isAccessibleView
            ? 'border-primary-600 bg-primary-600 text-white shadow-primary-600/20'
            : 'border-slate-200/90 bg-white/95 text-slate-700 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        {isAccessibleView ? (
          <>
            <Network className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ver Grafo</span>
          </>
        ) : (
          <>
            <List className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Lista Acessível</span>
          </>
        )}
      </button>

      {/* Painel de Controles de Zoom e Filtro Rápido */}
      {!isAccessibleView && (
        <div className="flex flex-col gap-1 rounded-xl border border-slate-200/80 bg-white/95 p-1 shadow-md backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95">
          <button
            type="button"
            onClick={onToggleUrgentOnly}
            aria-pressed={showUrgentOnly}
            aria-label="Filtrar apenas tópicos com revisões pendentes ou flashcards vencidos"
            title={showUrgentOnly ? 'Mostrar todos os tópicos' : 'Filtrar apenas tópicos com pendências urgentes'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
              showUrgentOnly
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="my-0.5 h-px w-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

          <button
            type="button"
            onClick={onZoomIn}
            aria-label="Aumentar zoom do mapa"
            title="Aumentar zoom (+)"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onZoomOut}
            aria-label="Diminuir zoom do mapa"
            title="Diminuir zoom (-)"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onFitGraph}
            aria-label="Enquadrar e centralizar constelação na tela"
            title="Centralizar mapa"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  );
});
