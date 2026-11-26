import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { mapService } from '../services/map.service';
import type { GraphNode, GraphEdge, UserTopicMastery, MasteryState } from '../types/map.types';

export interface UseReviewMapReturn {
  readonly graph: { nodes: readonly GraphNode[]; edges: readonly GraphEdge[]; graphVersion: string } | null;
  readonly overlay: Record<string, UserTopicMastery>;
  readonly summary: { totalTopics: number; studiedTopics: number; masteredTopics: number; globalCoveragePercentage: number } | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly selectedNodeId: string | null;
  readonly selectedNode: GraphNode | null;
  readonly depth: number;
  readonly filterDisciplineId: string | null;
  readonly filterMastery: MasteryState | 'ALL';
  readonly hoveredNodeId: string | null;
  readonly highlightNodeIds: ReadonlySet<string>;
  readonly highlightEdgeIds: ReadonlySet<string>;
  readonly selectNode: (id: string | null) => void;
  readonly setHoveredNodeId: (id: string | null) => void;
  readonly setDepth: (depth: number) => void;
  readonly setFilterDisciplineId: (discId: string | null) => void;
  readonly setFilterMastery: (state: MasteryState | 'ALL') => void;
}

export function useReviewMap(initialHoveredId: string | null = null): UseReviewMapReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedNodeId = searchParams.get('node');
  const depth = Number(searchParams.get('depth') || '2');
  const filterDisciplineId = searchParams.get('disc') || null;
  const filterMastery = (searchParams.get('mastery') as MasteryState | 'ALL') || 'ALL';

  // 1. Grafo canônico compartilhado (cacheado no cliente com staleTime alto)
  const {
    data: graphData,
    isLoading: isLoadingGraph,
    isError: isErrorGraph,
  } = useQuery({
    queryKey: ['review-map-graph', filterDisciplineId],
    queryFn: () => mapService.getGraph({ disciplineId: filterDisciplineId || undefined }),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // 2. Overlay privado do usuário autenticado
  const {
    data: overlayData,
    isLoading: isLoadingOverlay,
    isError: isErrorOverlay,
  } = useQuery({
    queryKey: ['review-map-overlay', filterDisciplineId],
    queryFn: () => mapService.getOverlay(filterDisciplineId || undefined),
    staleTime: 1000 * 30, // 30 segundos
  });

  const selectNode = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) {
            next.set('node', id);
          } else {
            next.delete('node');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setDepth = useCallback(
    (newDepth: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('depth', String(newDepth));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setFilterDisciplineId = useCallback(
    (discId: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (discId) {
            next.set('disc', discId);
          } else {
            next.delete('disc');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setFilterMastery = useCallback(
    (state: MasteryState | 'ALL') => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (state !== 'ALL') {
            next.set('mastery', state);
          } else {
            next.delete('mastery');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Mapeamento do nó selecionado
  const selectedNode = useMemo(() => {
    if (!graphData || !selectedNodeId) return null;
    return graphData.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [graphData, selectedNodeId]);

  // Foco + Contexto: nós e arestas conectados ao nó ativo (selecionado ou em hover)
  const activeFocusId = selectedNodeId || initialHoveredId;

  const { highlightNodeIds, highlightEdgeIds } = useMemo(() => {
    const nodesSet = new Set<string>();
    const edgesSet = new Set<string>();

    if (!graphData || !activeFocusId) {
      return { highlightNodeIds: nodesSet, highlightEdgeIds: edgesSet };
    }

    nodesSet.add(activeFocusId);

    // Encontra arestas incidentes e nós vizinhos
    for (const edge of graphData.edges) {
      if (edge.source === activeFocusId) {
        nodesSet.add(edge.target);
        edgesSet.add(edge.id);
      } else if (edge.target === activeFocusId) {
        nodesSet.add(edge.source);
        edgesSet.add(edge.id);
      }
    }

    // Se o nó tiver pai na hierarquia
    const targetNode = graphData.nodes.find((n) => n.id === activeFocusId);
    if (targetNode?.parentId) {
      nodesSet.add(targetNode.parentId);
    }

    return { highlightNodeIds: nodesSet, highlightEdgeIds: edgesSet };
  }, [graphData, activeFocusId]);

  return {
    graph: graphData
      ? { nodes: graphData.nodes, edges: graphData.edges, graphVersion: graphData.graphVersion }
      : null,
    overlay: overlayData?.masteries ?? {},
    summary: overlayData?.summary ?? null,
    isLoading: isLoadingGraph || isLoadingOverlay,
    isError: isErrorGraph || isErrorOverlay,
    selectedNodeId,
    selectedNode,
    depth,
    filterDisciplineId,
    filterMastery,
    hoveredNodeId: initialHoveredId,
    highlightNodeIds,
    highlightEdgeIds,
    selectNode,
    setHoveredNodeId: () => {},
    setDepth,
    setFilterDisciplineId,
    setFilterMastery,
  };
}
