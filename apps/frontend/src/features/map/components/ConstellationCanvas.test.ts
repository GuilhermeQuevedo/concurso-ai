import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ConstellationCanvas } from './ConstellationCanvas';
import type { GraphNode, GraphEdge, UserTopicMastery } from '../types/map.types';

describe('ConstellationCanvas Component (Phase 4 — Batch 1 & 2)', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'node-1',
      name: 'Atos Administrativos',
      slug: 'atos-adm',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 1,
      description: null,
      parentId: null,
      subjectId: 'sub-1',
      incidenceWeight: 1.5,
      x: 100,
      y: 150,
    },
    {
      id: 'node-2',
      name: 'Poder de Polícia',
      slug: 'poder-policia',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 2,
      description: null,
      parentId: null,
      subjectId: 'sub-1',
      incidenceWeight: 1.2,
      x: 250,
      y: 200,
    },
  ];

  const mockEdges: GraphEdge[] = [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'PREREQUISITE',
      typeLabel: 'Pré-requisito',
      evidence: 'Vínculo conceitual',
      sourceRef: null,
      confidence: 0.9,
    },
  ];

  const mockMasteries: Record<string, UserTopicMastery> = {
    'node-1': {
      topicId: 'node-1',
      masteryScore: 80,
      state: 'MASTERED',
      stateLabel: 'Dominado',
      accuracy: 0.8,
      attemptsCount: 10,
      correctCount: 8,
      dueFlashcardsCount: 2,
      priorityScore: 30,
      lastAttemptAt: null,
      calculatedAt: '2026-11-19T10:00:00Z',
    },
  };

  it('deve renderizar o elemento canvas com acessibilidade semântica', () => {
    const html = renderToString(
      React.createElement(ConstellationCanvas, {
        nodes: mockNodes,
        edges: mockEdges,
        masteries: mockMasteries,
        selectedNodeId: null,
        highlightNodeIds: new Set<string>(),
        highlightEdgeIds: new Set<string>(),
        onSelectNode: () => {},
      }),
    );

    assert.ok(html.includes('role="application"'));
    assert.ok(html.includes('aria-label="Constelação visual do Mapa de Revisão"'));
  });

  it('deve aplicar cursor-grab por padrão para suportar navegação panorâmica', () => {
    const html = renderToString(
      React.createElement(ConstellationCanvas, {
        nodes: mockNodes,
        edges: mockEdges,
        masteries: mockMasteries,
        selectedNodeId: null,
        highlightNodeIds: new Set<string>(),
        highlightEdgeIds: new Set<string>(),
        onSelectNode: () => {},
      }),
    );

    assert.ok(html.includes('cursor-grab'));
    assert.ok(html.includes('touch-none'));
  });
});
