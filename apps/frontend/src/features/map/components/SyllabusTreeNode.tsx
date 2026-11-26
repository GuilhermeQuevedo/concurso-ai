import { memo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  MapPin,
  TrendingUp,
  CircleAlert,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

export interface SyllabusTreeNodeProps {
  readonly node: GraphNode;
  readonly depth: number;
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly isSelected: boolean;
  readonly mastery?: UserTopicMastery;
  readonly onToggleExpand: () => void;
  readonly onSelect: () => void;
  readonly onFocusOnMap: () => void;
}

/**
 * Retorna as classes de cor e estilo do nó conforme o nível de domínio em matiz única Teal.
 */
function getNodeMasteryStyle(score: number, isNotStarted: boolean) {
  if (isNotStarted) {
    return {
      badgeClass: 'border-dashed border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400',
      barClass: 'bg-slate-300 dark:bg-slate-700',
      icon: CircleAlert,
    };
  }

  if (score >= 75) {
    return {
      badgeClass: 'border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
      barClass: 'bg-teal-600',
      icon: CheckCircle2,
    };
  }

  return {
    badgeClass: 'border-teal-200 bg-teal-50/60 text-teal-700 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-400',
    barClass: 'bg-teal-500',
    icon: Clock,
  };
}

/**
 * Linha individual da Árvore do Edital.
 * Renderiza atributos de estudo (domínio, flashcards vencidos, incidência na banca)
 * e atalhos para focar no grafo ou abrir o painel de ação.
 */
export const SyllabusTreeNode = memo(function SyllabusTreeNode({
  node,
  depth,
  hasChildren,
  isExpanded,
  isSelected,
  mastery,
  onToggleExpand,
  onSelect,
  onFocusOnMap,
}: SyllabusTreeNodeProps) {
  const isNotStarted = !mastery || mastery.state === 'NOT_STARTED';
  const score = mastery ? Math.round(mastery.masteryScore) : 0;
  const dueCards = mastery?.dueFlashcardsCount ?? 0;
  const style = getNodeMasteryStyle(score, isNotStarted);
  const StatusIcon = style.icon;

  // Indentação progressiva conforme profundidade hierárquica
  const indentPadding = depth === 0 ? 'pl-3' : depth === 1 ? 'pl-8' : 'pl-14';

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      className={`group flex items-center justify-between border-b border-slate-100 py-2.5 pr-3 text-xs transition-colors dark:border-slate-800/70 ${indentPadding} ${
        isSelected
          ? 'bg-primary-50/80 dark:bg-primary-950/40'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
      }`}
    >
      {/* Lado Esquerdo: Chevron de expansão + Nível + Título */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? `Recolher ${node.name}` : `Expandir ${node.name}`}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="w-6 shrink-0" aria-hidden="true" />
        )}

        <div
          onClick={onSelect}
          className="flex flex-col min-w-0 flex-1 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
              {node.levelLabel}
            </span>

            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {node.name}
            </span>
          </div>

          {/* Subtítulo com Domínio e Incidência */}
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{isNotStarted ? 'Não estudado' : `${score}% dominado`}</span>
            </span>

            <span>·</span>

            <span className="flex items-center gap-0.5 text-amber-700 dark:text-amber-400">
              <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{`Incidência: ${node.incidenceWeight}x`}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Lado Direito: Badge de Flashcards Vencidos + Ações */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {/* Anel/Badge de Flashcards Vencidos */}
        {dueCards > 0 && (
          <span
            title={`${dueCards} flashcards para revisar hoje`}
            className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
          >
            <Layers className="h-3 w-3" aria-hidden="true" />
            <span>{dueCards}</span>
          </span>
        )}

        {/* Botão Ver no Grafo Local */}
        <button
          type="button"
          onClick={onFocusOnMap}
          aria-label={`Ver ${node.name} no grafo constelação`}
          title="Ver este tópico e suas relações no grafo"
          className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <MapPin className="h-3 w-3 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <span className="hidden sm:inline">No Grafo</span>
        </button>

        {/* Botão Abrir Painel de Estudo */}
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Abrir detalhes de estudo de ${node.name}`}
          className="flex h-7 items-center rounded-lg bg-slate-100 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          Detalhes
        </button>
      </div>
    </div>
  );
});
