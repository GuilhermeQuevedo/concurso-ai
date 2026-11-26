import { useEffect, useRef, useCallback } from 'react';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceCenter,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { GraphNode, GraphEdge } from '../types/map.types';

export interface SimNode extends SimulationNodeDatum, Omit<GraphNode, 'x' | 'y'> {
  x: number;
  y: number;
  readonly radius: number;
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  readonly id: string;
}

export function calculateNodeRadius(node: GraphNode): number {
  // Padrão Obsidian: Nós delicados, compactos e esféricos
  const baseRadius = node.level === 'DISCIPLINE' ? 6.5 : node.level === 'TOPIC' ? 4.5 : 3.2;
  const incidenceBonus = Math.min(1.5, Math.max(0, (node.incidenceWeight - 1.0) * 1.0));
  return baseRadius + incidenceBonus;
}

export interface UseConstellationSimulationOptions {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly onTick?: () => void;
}

export function useConstellationSimulation({
  nodes,
  edges,
  onTick,
}: UseConstellationSimulationOptions) {
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  // Inicializa ou reconfigura a simulação elástica
  useEffect(() => {
    if (nodes.length === 0) {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      simNodesRef.current = [];
      simLinksRef.current = [];
      return;
    }

    // Calcula os limites das coordenadas brutas para recentralizar na origem (0, 0)
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const n of nodes) {
      const nx = typeof n.x === 'number' ? n.x : 0;
      const ny = typeof n.y === 'number' ? n.y : 0;
      if (nx < minX) minX = nx;
      if (nx > maxX) maxX = nx;
      if (ny < minY) minY = ny;
      if (ny > maxY) maxY = ny;
    }

    const rawCenterX = (minX + maxX) / 2 || 0;
    const rawCenterY = (minY + maxY) / 2 || 0;
    const rawSpan = Math.max(maxX - minX, maxY - minY, 100);

    // Escala inicial harmoniosa (~280px de extensão para formar um cluster centrado)
    const initialScale = Math.min(1.0, 280 / rawSpan);

    // Preserva coordenadas anteriores caso os nós já existam na simulação
    const prevPositionMap = new Map<string, { x: number; y: number }>();
    for (const sn of simNodesRef.current) {
      if (typeof sn.x === 'number' && typeof sn.y === 'number') {
        prevPositionMap.set(sn.id, { x: sn.x, y: sn.y });
      }
    }

    const nextSimNodes: SimNode[] = nodes.map((n) => {
      const prev = prevPositionMap.get(n.id);
      const nx = typeof n.x === 'number' ? n.x : 0;
      const ny = typeof n.y === 'number' ? n.y : 0;
      const initX = prev ? prev.x : (nx - rawCenterX) * initialScale;
      const initY = prev ? prev.y : (ny - rawCenterY) * initialScale;

      return {
        ...n,
        x: initX,
        y: initY,
        radius: calculateNodeRadius(n),
      };
    });

    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const nextSimLinks: SimLink[] = edges
      .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      }));

    simNodesRef.current = nextSimNodes;
    simLinksRef.current = nextSimLinks;

    // Física maleável coesa com gravidade radial ao centro (elástica, viva e coesa como Obsidian)
    const sim = forceSimulation<SimNode, SimLink>(nextSimNodes)
      .force('charge', forceManyBody<SimNode>().strength(-55).distanceMax(220))
      .force(
        'link',
        forceLink<SimNode, SimLink>(nextSimLinks)
          .id((d) => d.id)
          .distance(42)
          .strength(0.65),
      )
      .force(
        'collide',
        forceCollide<SimNode>((d) => d.radius + 8).iterations(2),
      )
      .force('x', forceX<SimNode>(0).strength(0.10))
      .force('y', forceY<SimNode>(0).strength(0.10))
      .force('center', forceCenter<SimNode>(0, 0))
      .alphaDecay(0.015)
      .velocityDecay(0.20);

    sim.on('tick', () => {
      onTickRef.current?.();
    });

    simulationRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [nodes, edges]);

  // Busca nó na posição com margem ampliada para toque/clique
  const getNodeAt = useCallback((modelX: number, modelY: number): SimNode | null => {
    const simNodes = simNodesRef.current;
    for (let i = simNodes.length - 1; i >= 0; i--) {
      const node = simNodes[i];
      if (typeof node.x !== 'number' || typeof node.y !== 'number') continue;
      const touchRadius = node.radius + 10;
      const dist = Math.hypot(node.x - modelX, node.y - modelY);
      if (dist <= touchRadius) {
        return node;
      }
    }
    return null;
  }, []);

  // Inicia arrasto com maleabilidade elástica
  const startDrag = useCallback((nodeId: string, modelX: number, modelY: number) => {
    const sim = simulationRef.current;
    if (!sim) return;

    const node = simNodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;

    node.fx = modelX;
    node.fy = modelY;
    sim.alphaTarget(0.3).restart();
  }, []);

  // Atualiza posição do nó durante arrasto
  const updateDrag = useCallback((nodeId: string, modelX: number, modelY: number) => {
    const node = simNodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;

    node.fx = modelX;
    node.fy = modelY;
  }, []);

  // Finaliza arrasto liberando a mola com amortecimento suave
  const endDrag = useCallback((nodeId: string) => {
    const sim = simulationRef.current;
    const node = simNodesRef.current.find((n) => n.id === nodeId);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
    if (sim) {
      sim.alphaTarget(0);
    }
  }, []);

  // Recentraliza o grafo
  const reheat = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.alpha(0.5).restart();
    }
  }, []);

  return {
    simNodesRef,
    simLinksRef,
    getNodeAt,
    startDrag,
    updateDrag,
    endDrag,
    reheat,
  };
}
