import { useState, useRef, useMemo, memo } from 'react';
import { Network, Loader2, AlertCircle, RotateCw } from 'lucide-react';
import { ConstellationCanvas, type ConstellationCanvasHandle } from './ConstellationCanvas';
import { Constellation3DCanvas } from './Constellation3DCanvas';
import { ConstellationControls } from './ConstellationControls';
import { ConstellationSatellites } from './ConstellationSatellites';
import { ConstellationKeyboardList } from './ConstellationKeyboardList';
import { SyllabusTreeView } from './SyllabusTreeView';
import { MapViewSwitcher, type MapViewMode } from './MapViewSwitcher';
import { NodeActionDrawer } from './NodeActionDrawer';
import { MapLegend } from './MapLegend';
import { WeakPointsModal } from './WeakPointsModal';
import { MapExportDialog } from './MapExportDialog';
import { MapActionToolbar } from './MapActionToolbar';
import { calculateWeakPoints } from '../utils/weak-points';
import { useReviewMap } from '../hooks/useReviewMap';
import { isFeatureEnabled } from '@/config/feature-flags';
import type { MasteryState } from '../types/map.types';

export interface ReviewMapContainerProps {
  readonly onOpenNodeAction?: (nodeId: string) => void;
}

/**
 * Container Orquestrador do Mapa de Revisão (Engrama).
 *
 * Gerencia as duas visões centrais da plataforma:
 * 1. Constelação (Grafo 2D no Canvas, com memória espacial estável)
 * 2. Árvore do Edital (Visão hierárquica por disciplina/tópico/subtópico, padrão no mobile < 768px)
 *
 * Além de suportar controles espaciais, satélites em foco, legenda acessível
 * e o painel de ação (drawer/bottom sheet).
 */
export const ReviewMapContainer = memo(function ReviewMapContainer({
  onOpenNodeAction,
}: ReviewMapContainerProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [isAccessibleView, setIsAccessibleView] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWeakPointsOpen, setIsWeakPointsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<MapViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'TREE' : 'CONSTELLATION',
  );
  const canvasRef = useRef<ConstellationCanvasHandle | null>(null);
  const isAstryxChrome = isFeatureEnabled('ASTRYX_MAP_CHROME');

  const {
    graph,
    overlay,
    summary,
    isLoading,
    isError,
    error,
    refetch,
    selectedNodeId,
    selectedNode,
    depth,
    filterMastery,
    highlightNodeIds,
    highlightEdgeIds,
    selectNode,
    setDepth,
    setFilterMastery,
  } = useReviewMap(hoveredNodeId);

  const handleSelectNode = (id: string | null) => {
    selectNode(id);
    if (id) {
      if (onOpenNodeAction) {
        onOpenNodeAction(id);
      }
    } else {
      setIsDrawerOpen(false);
    }
  };

  const handleZoomIn = () => canvasRef.current?.zoomIn();
  const handleZoomOut = () => canvasRef.current?.zoomOut();
  const handleFitGraph = () => canvasRef.current?.fitGraph();

  // Pontos fracos para o badge e modal
  const weakPoints = useMemo(() => {
    if (!graph) return [];
    return calculateWeakPoints(graph.nodes, overlay, 5);
  }, [graph, overlay]);

  // Filtragem composta: Por nível de domínio e por urgência (flashcards vencidos / prioridade)
  const visibleNodes = useMemo(() => {
    if (!graph) return [];
    let list = graph.nodes;

    if (filterMastery !== 'ALL') {
      list = list.filter((n) => {
        const mastery = overlay[n.id];
        const state: MasteryState = mastery ? mastery.state : 'NOT_STARTED';
        return state === filterMastery;
      });
    }

    if (showUrgentOnly) {
      list = list.filter((n) => {
        const mastery = overlay[n.id];
        return mastery && (mastery.dueFlashcardsCount > 0 || mastery.priorityScore > 0);
      });
    }

    return list;
  }, [graph, overlay, filterMastery, showUrgentOnly]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center flex-col gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="text-sm font-medium">Carregando mapa de revisão do edital...</span>
      </div>
    );
  }

  if (isError || !graph) {
    return (
      <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center flex-col gap-3 text-slate-500 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Não foi possível carregar o Mapa de Revisão
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          {error?.message && error.message.includes('FEATURE_DISABLED')
            ? 'A funcionalidade do Mapa de Revisão está desabilitada nas configurações do servidor.'
            : 'Verifique sua conexão ou se a funcionalidade do mapa está habilitada para a sua conta.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors cursor-pointer"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Tentar novamente
        </button>
      </div>
    );
  }

  const nodes = graph.nodes;
  const edges = graph.edges;

  return (
    <div
      data-astryx-theme={isAstryxChrome ? 'engrama' : undefined}
      className={
        isAstryxChrome
          ? 'relative flex h-[calc(100vh-90px)] w-full flex-col overflow-hidden rounded-3xl border border-hairline bg-[var(--color-canvas)] text-[var(--color-text-primary)] shadow-sm'
          : 'relative flex h-[calc(100vh-90px)] w-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900'
      }
    >
      {/* Barra de Controle Superior */}
      <header
        className={
          isAstryxChrome
            ? 'z-10 flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-[var(--color-surface-elevated-1)]/90 px-5 py-3 backdrop-blur-md'
            : 'z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white/90 px-5 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90'
        }
      >
        <div className="flex items-center gap-3">
          <div
            className={
              isAstryxChrome
                ? 'flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand)] text-white'
                : 'flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
            }
          >
            <Network className="h-5 w-5 stroke-[1.75px]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              Mapa de Revisão
              <span
                className={
                  isAstryxChrome
                    ? 'rounded-md bg-[var(--color-brand-subtle)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-brand)] border border-hairline'
                    : 'rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }
              >
                {viewMode === 'TREE' ? 'Árvore do Edital' : viewMode === 'UNIVERSE_3D' ? 'Universo 3D' : 'Constelação'}
              </span>
            </h1>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              {nodes.length} tópicos canônicos · {edges.length} relações aprovadas
            </p>
          </div>
        </div>

        {/* Alternador de Visão + Filtros e Controles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Alternador de Modo: Constelação vs Árvore do Edital */}
          <MapViewSwitcher activeView={viewMode} onChangeView={setViewMode} />

          {/* Barra de Ações Rápidas: Pontos Fracos + Exportar */}
          <MapActionToolbar
            weakPointsCount={weakPoints.length}
            onOpenWeakPoints={() => setIsWeakPointsOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
          />

          {/* Seletor de Filtro de Domínio */}
          <div
            className={
              isAstryxChrome
                ? 'flex items-center gap-1 rounded-xl bg-[var(--color-canvas)] p-1 border border-hairline'
                : 'flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80'
            }
          >
            <button
              type="button"
              onClick={() => setFilterMastery('ALL')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                filterMastery === 'ALL'
                  ? isAstryxChrome
                    ? 'bg-[var(--color-surface-elevated-1)] text-[var(--color-text-primary)] shadow-xs border border-hairline'
                    : 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : isAstryxChrome
                    ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterMastery('NOT_STARTED')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                filterMastery === 'NOT_STARTED'
                  ? isAstryxChrome
                    ? 'bg-[var(--color-surface-elevated-1)] text-[var(--color-text-primary)] shadow-xs border border-hairline'
                    : 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : isAstryxChrome
                    ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Não estudados
            </button>
            <button
              type="button"
              onClick={() => setFilterMastery('IN_PROGRESS')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                filterMastery === 'IN_PROGRESS'
                  ? isAstryxChrome
                    ? 'bg-[var(--color-surface-elevated-1)] text-[var(--color-text-primary)] shadow-xs border border-hairline'
                    : 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : isAstryxChrome
                    ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Em andamento
            </button>
            <button
              type="button"
              onClick={() => setFilterMastery('MASTERED')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                filterMastery === 'MASTERED'
                  ? isAstryxChrome
                    ? 'bg-[var(--color-surface-elevated-1)] text-[var(--color-text-primary)] shadow-xs border border-hairline'
                    : 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : isAstryxChrome
                    ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Dominados
            </button>
          </div>

          {/* Controle de Profundidade (ativo na Constelação) */}
          {viewMode === 'CONSTELLATION' && (
            <div
              className={
                isAstryxChrome
                  ? 'flex items-center gap-1.5 rounded-xl border border-hairline bg-[var(--color-canvas)] px-2 py-1 text-xs'
                  : 'flex items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-1 text-xs dark:border-slate-800'
              }
            >
              <span className="text-[var(--color-text-tertiary)]">Profundidade:</span>
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  className={`h-5 w-5 rounded-md font-bold transition-all cursor-pointer ${
                    depth === d
                      ? isAstryxChrome
                        ? 'bg-[var(--color-brand)] text-white shadow-xs'
                        : 'bg-primary-600 text-white'
                      : isAstryxChrome
                        ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated-2)]'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Área Central: Alterna entre Árvore do Edital, Universo 3D e Constelação */}
      <main className="relative flex-1 overflow-hidden">
        {nodes.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center flex-col gap-3 p-6 text-center text-slate-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Network className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Nenhum tópico mapeado ainda
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              O mapa canônico de tópicos deste edital ainda não possui nós cadastrados ou o banco de dados ainda não foi semeado com os tópicos do concurso.
            </p>
          </div>
        ) : visibleNodes.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center flex-col gap-3 p-6 text-center text-slate-500">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Nenhum tópico encontrado com os filtros atuais
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              Tente redefinir o filtro de domínio ou o filtro de urgência para visualizar os nós do mapa.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterMastery('ALL');
                setShowUrgentOnly(false);
              }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        ) : viewMode === 'TREE' ? (
          <SyllabusTreeView
            nodes={visibleNodes}
            masteries={overlay}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => {
              handleSelectNode(id);
              if (id) setIsDrawerOpen(true);
            }}
            onFocusOnMap={(id) => {
              selectNode(id);
              setViewMode('CONSTELLATION');
            }}
          />
        ) : viewMode === 'UNIVERSE_3D' ? (
          <>
            <Constellation3DCanvas
              nodes={visibleNodes}
              edges={edges}
              masteries={overlay}
              selectedNodeId={selectedNodeId}
              highlightNodeIds={highlightNodeIds}
              highlightEdgeIds={highlightEdgeIds}
              onSelectNode={handleSelectNode}
              onHoverNode={setHoveredNodeId}
            />

            {/* Satélites Flutuantes do Nó em Foco */}
            {selectedNode && (
              <ConstellationSatellites
                topicId={selectedNode.id}
                topicName={selectedNode.name}
                mastery={overlay[selectedNode.id]}
                onClose={() => selectNode(null)}
                onSelectConnectedTopic={(connId) => selectNode(connId)}
                onOpenDrawer={() => setIsDrawerOpen(true)}
              />
            )}

            {/* Legenda Acessível com Métricas Globais */}
            <MapLegend
              totalTopics={summary?.totalTopics ?? nodes.length}
              studiedTopics={summary?.studiedTopics ?? 0}
              coveragePercentage={summary?.globalCoveragePercentage ?? 0}
              isFocusActive={Boolean(selectedNode)}
            />
          </>
        ) : (
          <>
            <ConstellationCanvas
              ref={canvasRef}
              nodes={visibleNodes}
              edges={edges}
              masteries={overlay}
              selectedNodeId={selectedNodeId}
              highlightNodeIds={highlightNodeIds}
              highlightEdgeIds={highlightEdgeIds}
              onSelectNode={handleSelectNode}
              onHoverNode={setHoveredNodeId}
            />

            {/* Controles Flutuantes (Zoom, Recenter, Filtro Urgência, Alternar Lista WCAG) */}
            <ConstellationControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitGraph={handleFitGraph}
              showUrgentOnly={showUrgentOnly}
              onToggleUrgentOnly={() => setShowUrgentOnly((prev) => !prev)}
              isAccessibleView={isAccessibleView}
              onToggleAccessibleView={() => setIsAccessibleView((prev) => !prev)}
            />

            {/* Satélites Flutuantes do Nó em Foco */}
            {selectedNode && (
              <ConstellationSatellites
                topicId={selectedNode.id}
                topicName={selectedNode.name}
                mastery={overlay[selectedNode.id]}
                onClose={() => selectNode(null)}
                onSelectConnectedTopic={(connId) => selectNode(connId)}
                onOpenDrawer={() => setIsDrawerOpen(true)}
              />
            )}

            {/* Visão em Lista Acessível Alternativa (WCAG AA) */}
            {isAccessibleView && (
              <ConstellationKeyboardList
                nodes={visibleNodes}
                masteries={overlay}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
                onClose={() => setIsAccessibleView(false)}
              />
            )}

            {/* Legenda Acessível com Métricas Globais */}
            {!isAccessibleView && (
              <MapLegend
                totalTopics={summary?.totalTopics ?? nodes.length}
                studiedTopics={summary?.studiedTopics ?? 0}
                coveragePercentage={summary?.globalCoveragePercentage ?? 0}
                isFocusActive={Boolean(selectedNode)}
              />
            )}
          </>
        )}

        {/* Drawer Lateral / Bottom Sheet de Ações Detalhadas (disponível em ambas as visões) */}
        {selectedNode && (
          <NodeActionDrawer
            isOpen={isDrawerOpen}
            topic={selectedNode}
            mastery={overlay[selectedNode.id]}
            onClose={() => setIsDrawerOpen(false)}
            onSelectConnectedTopic={(connId) => selectNode(connId)}
          />
        )}
      </main>

      {/* Modal do Modo: Revisar Meus Pontos Fracos */}
      <WeakPointsModal
        isOpen={isWeakPointsOpen}
        nodes={graph.nodes}
        overlay={overlay}
        onClose={() => setIsWeakPointsOpen(false)}
        onFocusTopicOnMap={(topicId) => {
          selectNode(topicId);
          setViewMode('CONSTELLATION');
        }}
      />

      {/* Diálogo de Exportação e Compartilhamento */}
      <MapExportDialog
        isOpen={isExportOpen}
        nodes={graph.nodes}
        edges={graph.edges}
        onClose={() => setIsExportOpen(false)}
        onExportPng={() => canvasRef.current?.exportAsImage() ?? null}
      />
    </div>
  );
});
