import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import { prisma } from '../database/prisma.js';

export interface LayoutNodeInput {
  readonly id: string;
  readonly disciplineId: string;
  readonly level: 'DISCIPLINE' | 'TOPIC' | 'SUBTOPIC';
  readonly fixedX?: number;
  readonly fixedY?: number;
}

export interface LayoutEdgeInput {
  readonly id: string;
  readonly source: string;
  readonly target: string;
}

export interface NodePositionOutput {
  readonly topicId: string;
  readonly x: number;
  readonly y: number;
}

export interface LayoutOptions {
  readonly seed?: number;
  readonly iterations?: number;
  readonly radius?: number;
}

export const DEFAULT_LAYOUT_OPTIONS: Required<LayoutOptions> = {
  seed: 20261119,
  iterations: 300,
  radius: 650,
};

/**
 * Gerador pseudo-aleatório determinístico Mulberry32 com semente fixa.
 */
export function createMulberry32(seed: number): () => number {
  let s = Math.floor(seed);
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  disciplineId: string;
  level: 'DISCIPLINE' | 'TOPIC' | 'SUBTOPIC';
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
}

export class LayoutService {
  constructor(private readonly db: typeof prisma = prisma) {}

  /**
   * FUNÇÃO PURA HEADLESS: Calcula as coordenadas (x, y) determinísticas para o grafo.
   * Não realiza I/O.
   */
  public static computePureLayout(
    nodes: readonly LayoutNodeInput[],
    edges: readonly LayoutEdgeInput[],
    options: LayoutOptions = {},
  ): NodePositionOutput[] {
    if (nodes.length === 0) {
      return [];
    }

    const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
    const rng = createMulberry32(opts.seed);

    // Mapeia disciplinas únicas para calcular centros angulares no anel
    const uniqueDisciplines = Array.from(new Set(nodes.map((n) => n.disciplineId || 'default'))).sort();
    const disciplineCenters = new Map<string, { cx: number; cy: number }>();

    const totalDisciplines = uniqueDisciplines.length;
    uniqueDisciplines.forEach((disc, idx) => {
      const angle = (idx / Math.max(1, totalDisciplines)) * 2 * Math.PI;
      const dist = totalDisciplines > 1 ? opts.radius * 0.55 : 0;
      disciplineCenters.set(disc, {
        cx: Number((Math.cos(angle) * dist).toFixed(2)),
        cy: Number((Math.sin(angle) * dist).toFixed(2)),
      });
    });

    // Nós da simulação
    const simNodes: SimNode[] = nodes.map((node) => {
      const center = disciplineCenters.get(node.disciplineId || 'default') ?? { cx: 0, cy: 0 };

      // Se o nó já estiver fixado (layout incremental)
      if (typeof node.fixedX === 'number' && typeof node.fixedY === 'number') {
        return {
          id: node.id,
          disciplineId: node.disciplineId,
          level: node.level,
          x: node.fixedX,
          y: node.fixedY,
          fx: node.fixedX,
          fy: node.fixedY,
        };
      }

      // Inicialização determinística em espiral próxima ao centro da disciplina
      const angle = rng() * 2 * Math.PI;
      const radiusOffset = 20 + rng() * 60;
      const x0 = center.cx + Math.cos(angle) * radiusOffset;
      const y0 = center.cy + Math.sin(angle) * radiusOffset;

      return {
        id: node.id,
        disciplineId: node.disciplineId,
        level: node.level,
        x: x0,
        y: y0,
      };
    });

    const nodeById = new Map<string, SimNode>(simNodes.map((n) => [n.id, n]));

    // Arestas da simulação
    const simLinks: SimLink[] = edges
      .filter((e) => nodeById.has(e.source) && nodeById.has(e.target))
      .map((e) => ({
        id: e.id,
        source: nodeById.get(e.source)!,
        target: nodeById.get(e.target)!,
      }));

    // Simulação headless do d3-force com semente fixa
    const simulation = forceSimulation<SimNode>(simNodes)
      .randomSource(rng)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((link) => {
            const src = typeof link.source === 'object' ? link.source.level : 'TOPIC';
            const tgt = typeof link.target === 'object' ? link.target.level : 'TOPIC';
            if (src === 'DISCIPLINE' || tgt === 'DISCIPLINE') return 90;
            return 65;
          })
          .strength(0.7),
      )
      .force('charge', forceManyBody<SimNode>().strength(-180).distanceMax(500))
      .force(
        'collide',
        forceCollide<SimNode>().radius((d) => {
          if (d.level === 'DISCIPLINE') return 36;
          if (d.level === 'TOPIC') return 24;
          return 16;
        }),
      )
      .force(
        'x',
        forceX<SimNode>((d) => disciplineCenters.get(d.disciplineId)?.cx ?? 0).strength(0.15),
      )
      .force(
        'y',
        forceY<SimNode>((d) => disciplineCenters.get(d.disciplineId)?.cy ?? 0).strength(0.15),
      )
      .stop();

    // Executa as iterações headless até estabilizar a física
    for (let i = 0; i < opts.iterations; ++i) {
      simulation.tick();
    }

    return simNodes.map((n) => {
      const rawX = Number((n.x ?? 0).toFixed(2));
      const rawY = Number((n.y ?? 0).toFixed(2));
      return {
        topicId: n.id,
        x: Object.is(rawX, -0) ? 0 : rawX,
        y: Object.is(rawY, -0) ? 0 : rawY,
      };
    });
  }

  /**
   * Garante e retorna as posições estáveis para uma graphVersion.
   * Se já existirem no banco, retorna imediatamente. Caso contrário, calcula de forma
   * determinística e persiste na tabela TopicLayoutPosition.
   */
  public async getOrComputePositions(
    graphVersion: string,
    nodes: readonly { id: string; parentId: string | null; level: 'DISCIPLINE' | 'TOPIC' | 'SUBTOPIC'; subjectId: string | null }[],
    edges: readonly { id: string; source: string; target: string }[],
  ): Promise<Map<string, { x: number; y: number }>> {
    // 1. Tenta carregar do banco para esta graphVersion
    const existingPositions = await this.db.topicLayoutPosition.findMany({
      where: { graphVersion },
    });

    if (existingPositions.length === nodes.length && nodes.length > 0) {
      const map = new Map<string, { x: number; y: number }>();
      for (const pos of existingPositions) {
        map.set(pos.topicId, { x: pos.x, y: pos.y });
      }
      return map;
    }

    // 2. Busca posições anteriores para suporte a posicionamento incremental sem mover nós existentes
    const previousPositions = await this.db.topicLayoutPosition.findMany({
      distinct: ['topicId'],
      orderBy: { createdAt: 'desc' },
    });

    const previousMap = new Map<string, { x: number; y: number }>();
    for (const p of previousPositions) {
      previousMap.set(p.topicId, { x: p.x, y: p.y });
    }

    // Prepara entrada com nós já fixados se existirem
    const layoutNodes: LayoutNodeInput[] = nodes.map((n) => {
      const prev = previousMap.get(n.id);
      return {
        id: n.id,
        disciplineId: n.subjectId || n.parentId || 'default',
        level: n.level,
        fixedX: prev?.x,
        fixedY: prev?.y,
      };
    });

    const layoutEdges: LayoutEdgeInput[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }));

    // Se mais de 80% dos nós já tiverem posição fixa, roda poucas iterações incrementais
    const hasFixedNodes = layoutNodes.some((n) => typeof n.fixedX === 'number');
    const iterations = hasFixedNodes ? 60 : DEFAULT_LAYOUT_OPTIONS.iterations;

    const computed = LayoutService.computePureLayout(layoutNodes, layoutEdges, { iterations });

    // Persiste idempotentemente para esta graphVersion
    const positionMap = new Map<string, { x: number; y: number }>();

    for (const p of computed) {
      positionMap.set(p.topicId, { x: p.x, y: p.y });

      await this.db.topicLayoutPosition.upsert({
        where: {
          graphVersion_topicId: {
            graphVersion,
            topicId: p.topicId,
          },
        },
        create: {
          graphVersion,
          topicId: p.topicId,
          x: p.x,
          y: p.y,
          pinned: true,
        },
        update: {
          x: p.x,
          y: p.y,
        },
      });
    }

    return positionMap;
  }
}

export const layoutService = new LayoutService();
