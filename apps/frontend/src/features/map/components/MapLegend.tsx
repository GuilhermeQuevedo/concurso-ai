import { memo, useState, useEffect } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@astryxdesign/core';
import { isFeatureEnabled } from '@/config/feature-flags';

export interface MapLegendProps {
  readonly totalTopics?: number;
  readonly studiedTopics?: number;
  readonly coveragePercentage?: number;
  readonly defaultExpanded?: boolean;
  /** Indica se há um nó/tópico em foco ativo no mapa (usado para prevenir colisão visual) */
  readonly isFocusActive?: boolean;
}

/**
 * Legenda oficial e acessível do Mapa de Revisão (Design System Engrama / Astryx).
 * Aplica redundância não cromática (texto, formas, anéis e escala de uma matiz teal OKLCH)
 * para atender às diretrizes WCAG 2.1 AA e usabilidade cognitiva.
 *
 * Suporta colapso/expansão suave e auto-colapso defensivo quando um tópico estiver em foco,
 * eliminando qualquer colisão com o painel de satélites em telas compactas.
 */
export const MapLegend = memo(function MapLegend({
  totalTopics = 0,
  studiedTopics = 0,
  coveragePercentage = 0,
  defaultExpanded = true,
  isFocusActive = false,
}: MapLegendProps) {
  const isAstryxChrome = isFeatureEnabled('ASTRYX_MAP_CHROME');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Auto-colapso defensivo: ao abrir um nó em foco em telas menores que 1024px,
  // recolhe a legenda automaticamente para a pílula compacta
  useEffect(() => {
    if (isFocusActive && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  }, [isFocusActive]);

  const coverageLabel = `${studiedTopics}/${totalTopics} (${coveragePercentage}%)`;

  if (!isExpanded) {
    return (
      <div className="absolute bottom-4 left-4 z-20">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          aria-label="Abrir convenções do mapa"
          className={
            isAstryxChrome
              ? 'flex items-center gap-2 rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1)] px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)] shadow-md backdrop-blur-md hover:bg-[var(--color-surface-elevated-2)] transition-all cursor-pointer'
              : 'flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur-md hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-900/95 dark:text-slate-200 transition-all cursor-pointer'
          }
        >
          <Layers className="h-3.5 w-3.5 text-[var(--color-brand)] stroke-[1.75px]" />
          <span>Convenções do Mapa</span>
          {totalTopics > 0 && (
            isAstryxChrome ? (
              <Badge variant="neutral" label={coverageLabel} />
            ) : (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                {coverageLabel}
              </span>
            )
          )}
          <ChevronUp className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Legenda e convenções do Mapa de Revisão"
      className={
        isAstryxChrome
          ? 'absolute bottom-4 left-4 z-20 flex max-w-xs flex-col gap-3 rounded-2xl border border-hairline bg-[var(--color-surface-elevated-1)] p-4 shadow-lg backdrop-blur-md transition-all duration-base select-none'
          : 'absolute bottom-4 left-4 z-20 flex max-w-xs flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-lg backdrop-blur-md transition-all duration-base dark:border-slate-800/80 dark:bg-slate-900/95 select-none'
      }
    >
      <div className="flex items-center justify-between border-b border-hairline pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
          <Layers className="h-3.5 w-3.5 text-[var(--color-brand)] stroke-[1.75px]" />
          <span>Convenções do Mapa</span>
        </div>
        <div className="flex items-center gap-1.5">
          {totalTopics > 0 && (
            isAstryxChrome ? (
              <Badge variant="neutral" label={coverageLabel} />
            ) : (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                {coverageLabel}
              </span>
            )
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            aria-label="Minimizar convenções do mapa"
            title="Minimizar legenda"
            className="rounded-lg p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-elevated-2)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 text-xs text-[var(--color-text-secondary)]">
        {/* 1. Cor por domínio em matiz única (Teal H=195) */}
        <div>
          <span className="block text-[11px] font-semibold text-[var(--color-text-primary)]">
            Domínio do Conteúdo (Questões)
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full border"
              style={{ backgroundColor: 'var(--map-mastery-0)', borderColor: 'var(--map-mastery-1)' }}
              title="0% a 39%: Baixo domínio"
            />
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: 'var(--map-mastery-2)' }}
              title="40% a 74%: Em evolução"
            />
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: 'var(--map-mastery-3)' }}
              title="75% a 100%: Dominado"
            />
            <span className="text-[10px] text-[var(--color-text-tertiary)] ml-1">Matiz única: Baixo → Alto</span>
          </div>
        </div>

        {/* 2. Não estudado (tracejado) */}
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-[var(--color-text-tertiary)] opacity-60" />
          <span className="text-[11px]">Borda tracejada: Tópico ainda não estudado</span>
        </div>

        {/* 3. Flashcards vencidos (anel de alerta âmbar) */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-3.5 w-3.5 items-center justify-center">
            <span className="absolute h-full w-full rounded-full ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-slate-900" />
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--map-mastery-2)' }} />
          </span>
          <span className="text-[11px]">Anel âmbar: Flashcards vencidos hoje</span>
        </div>

        {/* 4. Tamanho por incidência */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--color-text-tertiary)]" />
            <span className="h-3 w-3 rounded-full bg-[var(--color-text-tertiary)]" />
            <span className="h-4 w-4 rounded-full bg-[var(--color-text-tertiary)]" />
          </div>
          <span className="text-[11px]">Tamanho do nó: Incidência na banca</span>
        </div>
      </div>

      <div className="rounded-lg bg-[var(--color-surface-elevated-2)] p-2 text-[10px] text-[var(--color-text-tertiary)] border border-hairline">
        <strong className="text-[var(--color-text-primary)]">Dica:</strong> Clique em um nó para abrir o painel de revisão imediata ou use a rolagem para aplicar zoom.
      </div>
    </aside>
  );
});
