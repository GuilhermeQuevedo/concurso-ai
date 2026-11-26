import { memo, useState, useMemo, useRef, useEffect } from 'react';
import { Search, Layers, ChevronRight, X } from 'lucide-react';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

export interface ConstellationKeyboardListProps {
  readonly nodes: readonly GraphNode[];
  readonly masteries: Record<string, UserTopicMastery>;
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (nodeId: string | null) => void;
  readonly onClose?: () => void;
}

/**
 * Alternativa Textual Acessível da Constelação (WCAG AA).
 *
 * Fornece navegação hierárquica completa para leitores de tela e usuários de teclado,
 * com busca instantânea, status legível de domínio e atalhos de seleção.
 */
export const ConstellationKeyboardList = memo(function ConstellationKeyboardList({
  nodes,
  masteries,
  selectedNodeId,
  onSelectNode,
  onClose,
}: ConstellationKeyboardListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Filtra nós pela busca
  const filteredNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return nodes;

    return nodes.filter(
      (node) =>
        node.name.toLowerCase().includes(query) ||
        node.levelLabel.toLowerCase().includes(query) ||
        (node.description && node.description.toLowerCase().includes(query)),
    );
  }, [nodes, searchQuery]);

  // Teclado: Navegação por setas (Cima / Baixo) e Enter para selecionar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(filteredNodes.length - 1, prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredNodes[focusedIndex];
      if (current) {
        onSelectNode(current.id);
      }
    } else if (e.key === 'Escape' && onClose) {
      e.preventDefault();
      onClose();
    }
  };

  // Garante scroll automático no item focado via teclado
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    if (items[focusedIndex]) {
      items[focusedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  return (
    <section
      role="region"
      aria-label="Lista textual acessível de tópicos de revisão"
      onKeyDown={handleKeyDown}
      className="absolute inset-0 z-30 flex flex-col bg-white/95 backdrop-blur-md dark:bg-slate-900/95"
    >
      {/* Barra de Busca e Fechamento */}
      <div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFocusedIndex(0);
            }}
            placeholder="Buscar tópico por nome ou nível (ex: Direito Penal, Princípios)..."
            aria-label="Buscar tópico no edital"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white dark:focus:border-primary-500"
          />
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar lista e voltar ao grafo visual"
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span>Voltar ao Grafo</span>
          </button>
        )}
      </div>

      {/* Rótulo de Contagem e Dica de Teclado */}
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-[11px] text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
        <span>{filteredNodes.length} tópicos encontrados</span>
        <span className="hidden sm:inline">Use ↑ ↓ para navegar · Enter para selecionar · Esc para fechar</span>
      </div>

      {/* Lista de Tópicos */}
      <ul
        ref={listRef}
        role="list"
        aria-label="Tópicos do edital e métricas de domínio"
        className="flex-1 divide-y divide-slate-100 overflow-y-auto p-2 dark:divide-slate-800/80"
      >
        {filteredNodes.length === 0 ? (
          <li className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Nenhum tópico encontrado para os termos pesquisados.
          </li>
        ) : (
          filteredNodes.map((node, index) => {
            const mastery = masteries[node.id];
            const isSelected = selectedNodeId === node.id;
            const isKeyboardFocused = focusedIndex === index;
            const dueCards = mastery?.dueFlashcardsCount ?? 0;
            const score = mastery ? Math.round(mastery.masteryScore) : 0;
            const statusLabel = mastery?.stateLabel ?? 'Não estudado';

            return (
              <li
                key={node.id}
                role="listitem"
                aria-selected={isSelected}
                onClick={() => onSelectNode(node.id)}
                className={`group flex items-center justify-between rounded-xl p-3 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary-50 text-primary-900 ring-1 ring-primary-500/30 dark:bg-primary-950/40 dark:text-primary-100'
                    : isKeyboardFocused
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex flex-col gap-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {node.levelLabel}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {node.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Domínio: <strong className="text-slate-700 dark:text-slate-200">{`${score}%`}</strong> ({statusLabel})
                    </span>
                    <span>·</span>
                    <span>{`Incidência: ${node.incidenceWeight}x`}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {dueCards > 0 && (
                    <span
                      title={`${dueCards} flashcards vencidos`}
                      className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    >
                      <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{dueCards}</span>
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600 transition-colors" aria-hidden="true" />
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
});
