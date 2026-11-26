import { describe, it } from 'node:test';
import assert from 'node:assert';
import { initGalaxy3DNodes, initGalaxy3DLinks, stepGalaxy3D } from './galaxy3DPhysics';
import type { GraphNode, GraphEdge } from '../types/map.types';

describe('galaxy3DPhysics', () => {
  const nodes: GraphNode[] = [
    {
      id: 'n-1',
      name: 'Constitucional',
      slug: 'const',
      level: 'DISCIPLINE',
      levelLabel: 'Disciplina',
      order: 1,
      description: null,
      parentId: null,
      subjectId: null,
      x: 100,
      y: 50,
      incidenceWeight: 1.2,
    },
    {
      id: 'n-2',
      name: 'Direitos Fundamentais',
      slug: 'direitos',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 2,
      description: null,
      parentId: 'n-1',
      subjectId: 'n-1',
      x: 150,
      y: 80,
      incidenceWeight: 1.0,
    },
  ];

  const edges: GraphEdge[] = [
    {
      id: 'e-1-2',
      source: 'n-1',
      target: 'n-2',
      type: 'PREREQUISITE',
      typeLabel: 'Pré-requisito',
      evidence: 'Base',
      sourceRef: null,
      confidence: 1.0,
    },
  ];

  it('should initialize 3D nodes with coordinates, radius and velocities', () => {
    const nodes3D = initGalaxy3DNodes(nodes);
    assert.strictEqual(nodes3D.length, 2);
    assert.ok(typeof nodes3D[0].z === 'number');
    assert.ok(nodes3D[0].radius >= 3.8);
    assert.strictEqual(nodes3D[1].radius, 2.8);
  });

  it('should initialize 3D links connecting valid nodes', () => {
    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const links3D = initGalaxy3DLinks(edges, nodeIdSet);
    assert.strictEqual(links3D.length, 1);
    assert.strictEqual(links3D[0].sourceId, 'n-1');
  });

  it('should relax positions without NaN or explosion during physics step', () => {
    const nodes3D = initGalaxy3DNodes(nodes);
    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const links3D = initGalaxy3DLinks(edges, nodeIdSet);

    for (let step = 0; step < 20; step++) {
      stepGalaxy3D(nodes3D, links3D, 0.05);
    }

    assert.ok(!Number.isNaN(nodes3D[0].x));
    assert.ok(!Number.isNaN(nodes3D[0].y));
    assert.ok(!Number.isNaN(nodes3D[0].z));
  });
});
