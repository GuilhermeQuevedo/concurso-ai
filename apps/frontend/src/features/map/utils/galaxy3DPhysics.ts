import type { GraphNode, GraphEdge } from '../types/map.types';

export interface Galaxy3DNode {
  readonly id: string;
  readonly name: string;
  readonly level: GraphNode['level'];
  readonly incidenceWeight: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
}

export interface Galaxy3DLink {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly optimalDistance: number;
}

function pseudoHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Converte nós do edital para o espaço tridimensional com raio compacto,
 * normalização de coordenadas e dispersão coesa (sem vazios gigantescos entre nós).
 */
export function initGalaxy3DNodes(nodes: readonly GraphNode[]): Galaxy3DNode[] {
  if (nodes.length === 0) return [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const rawSpan = Math.max(maxX - minX, maxY - minY, 100);

  // Escala compacta proporcional para formar um cluster harmônico estilo Obsidian (sem vazios gigantescos)
  const targetSpan = 55;
  const scale = targetSpan / rawSpan;

  return nodes.map((node) => {
    const hash = pseudoHash(node.id);
    const zOffset = ((hash % 100) / 50 - 1) * 14;
    const baseRadius = node.level === 'DISCIPLINE' ? 3.8 : node.level === 'TOPIC' ? 2.8 : 2.0;
    const bonus = Math.min(1.2, Math.max(0, (node.incidenceWeight - 1.0) * 1.0));

    return {
      id: node.id,
      name: node.name,
      level: node.level,
      incidenceWeight: node.incidenceWeight,
      x: (node.x - centerX) * scale,
      y: (node.y - centerY) * scale,
      z: zOffset,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: baseRadius + bonus,
    };
  });
}

/**
 * Converte arestas para links com restrição elástica compacta.
 */
export function initGalaxy3DLinks(
  edges: readonly GraphEdge[],
  nodeIdSet: ReadonlySet<string>,
): Galaxy3DLink[] {
  return edges
    .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
    .map((e) => ({
      id: e.id,
      sourceId: e.source,
      targetId: e.target,
      optimalDistance: 15,
    }));
}

/**
 * Passo de simulação física tridimensional (Lei de Hooke + Repulsão Coulombiana + Gravidade Central).
 * Calibrado para manter o cluster denso, fluido e coeso.
 */
export function stepGalaxy3D(
  nodes: Galaxy3DNode[],
  links: readonly Galaxy3DLink[],
  alpha = 0.05,
): void {
  const nodeMap = new Map<string, Galaxy3DNode>(nodes.map((n) => [n.id, n]));

  // 1. Repulsão controlada entre nós (evita sobreposição sem dispersar em excesso)
  const repulseStrength = 60 * alpha;
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const distSq = dx * dx + dy * dy + dz * dz + 1.0;
      const dist = Math.sqrt(distSq);

      if (dist < 80) {
        const force = repulseStrength / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        a.vx -= fx;
        a.vy -= fy;
        a.vz -= fz;
        b.vx += fx;
        b.vy += fy;
        b.vz += fz;
      }
    }
  }

  // 2. Tensão elástica nas arestas (mantém nós relacionados próximos)
  const linkStrength = 0.18 * alpha;
  for (const link of links) {
    const src = nodeMap.get(link.sourceId);
    const tgt = nodeMap.get(link.targetId);
    if (!src || !tgt) continue;

    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dz = tgt.z - src.z;
    const dist = Math.hypot(dx, dy, dz) || 1.0;
    const delta = dist - link.optimalDistance;

    const fx = (dx / dist) * delta * linkStrength;
    const fy = (dy / dist) * delta * linkStrength;
    const fz = (dz / dist) * delta * linkStrength;

    src.vx += fx;
    src.vy += fy;
    src.vz += fz;
    tgt.vx -= fx;
    tgt.vy -= fy;
    tgt.vz -= fz;
  }

  // 3. Gravidade central (atrai suavemente para o centro impedindo dispersão)
  const centerGravity = 0.07 * alpha;
  const damping = 0.85;

  for (const node of nodes) {
    node.vx -= node.x * centerGravity;
    node.vy -= node.y * centerGravity;
    node.vz -= node.z * centerGravity;

    node.vx *= damping;
    node.vy *= damping;
    node.vz *= damping;

    node.x += node.vx;
    node.y += node.vy;
    node.z += node.vz;
  }
}
