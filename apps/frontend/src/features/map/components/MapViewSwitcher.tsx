import { memo } from 'react';
import { Network, Orbit, FolderTree } from 'lucide-react';
import { isFeatureEnabled } from '@/config/feature-flags';

export type MapViewMode = 'CONSTELLATION' | 'UNIVERSE_3D' | 'TREE';

export interface MapViewSwitcherProps {
  readonly activeView: MapViewMode;
  readonly onChangeView: (mode: MapViewMode) => void;
}

/**
 * Alternador de Visão do Mapa de Revisão.
 *
 * Permite comutar fluidamente entre:
 * 1. Constelação (Grafo 2D maleável com física d3-force)
 * 2. Universo 3D (Navegação orbital 360° em Three.js com sinapses neon)
 * 3. Árvore do Edital (Visão hierárquica recolhível, padrão no Mobile)
 */
export const MapViewSwitcher = memo(function MapViewSwitcher({
  activeView,
  onChangeView,
}: MapViewSwitcherProps) {
  const isAstryxChrome = isFeatureEnabled('ASTRYX_MAP_CHROME');

  return (
    <div
      role="tablist"
      aria-label="Modo de visualização do mapa"
      className={
        isAstryxChrome
          ? 'flex items-center rounded-xl bg-[var(--color-canvas)] p-1 border border-hairline'
          : 'flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80'
      }
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'CONSTELLATION'}
        onClick={() => onChangeView('CONSTELLATION')}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
          activeView === 'CONSTELLATION'
            ? isAstryxChrome
              ? 'bg-[var(--color-surface-elevated-1)] text-[var(--color-text-primary)] shadow-xs border border-hairline'
              : 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
            : isAstryxChrome
              ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
        }`}
      >
        <Network className="h-3.5 w-3.5 stroke-[1.75px]" aria-hidden="true" />
        <span>Constelação</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'UNIVERSE_3D'}
        onClick={() => onChangeView('UNIVERSE_3D')}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
          activeView === 'UNIVERSE_3D'
            ? isAstryxChrome
              ? 'bg-[var(--color-surface-elevated-1)] text-[var(--color-text-primary)] shadow-xs border border-hairline'
              : 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
            : isAstryxChrome
              ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
        }`}
      >
        <Orbit className="h-3.5 w-3.5 stroke-[1.75px]" aria-hidden="true" />
        <span>Universo 3D</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'TREE'}
        onClick={() => onChangeView('TREE')}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
          activeView === 'TREE'
            ? isAstryxChrome
              ? 'bg-[var(--color-surface-elevated-1)] text-[var(--color-text-primary)] shadow-xs border border-hairline'
              : 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
            : isAstryxChrome
              ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
        }`}
      >
        <FolderTree className="h-3.5 w-3.5 stroke-[1.75px]" aria-hidden="true" />
        <span>Árvore do Edital</span>
      </button>
    </div>
  );
});
