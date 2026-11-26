import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateNodeRadius } from './useConstellationSimulation';
import type { GraphNode } from '../types/map.types';

describe('calculateNodeRadius', () => {
  const baseMockNode: GraphNode = {
    id: 'd-1',
    name: 'Constitucional',
    slug: 'const',
    level: 'DISCIPLINE',
    levelLabel: 'Disciplina',
    order: 1,
    description: null,
    parentId: null,
    subjectId: null,
    x: 0,
    y: 0,
    incidenceWeight: 1.0,
  };

  it('should return compact Obsidian sizes for disciplines', () => {
    const disciplineNode: GraphNode = { ...baseMockNode };
    const r = calculateNodeRadius(disciplineNode);
    assert.strictEqual(r, 6.5);
  });

  it('should return 4.5px base for topic and 3.2px for subtopic', () => {
    const topicNode: GraphNode = {
      ...baseMockNode,
      id: 't-1',
      name: 'Direitos Fundamentais',
      slug: 'direitos',
      level: 'TOPIC',
    };
    const subtopicNode: GraphNode = {
      ...topicNode,
      id: 's-1',
      level: 'SUBTOPIC',
    };

    assert.strictEqual(calculateNodeRadius(topicNode), 4.5);
    assert.strictEqual(calculateNodeRadius(subtopicNode), 3.2);
  });

  it('should add small bounded incidence bonus without exceeding 1.5px', () => {
    const highIncidenceNode: GraphNode = {
      ...baseMockNode,
      id: 'h-1',
      name: 'Controle de Constitucionalidade',
      slug: 'controle',
      level: 'TOPIC',
      incidenceWeight: 3.0,
    };
    const r = calculateNodeRadius(highIncidenceNode);
    assert.strictEqual(r, 6.0); // 4.5 + 1.5
  });
});
