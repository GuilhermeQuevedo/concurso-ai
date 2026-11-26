import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Constellation3DCanvas } from './Constellation3DCanvas';
import type { GraphNode, GraphEdge, UserTopicMastery } from '../types/map.types';

describe('Constellation3DCanvas Component', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'd-1',
      name: 'Direito Constitucional',
      slug: 'direito-constitucional',
      level: 'DISCIPLINE',
      levelLabel: 'Disciplina',
      order: 1,
      description: null,
      parentId: null,
      subjectId: null,
      x: 0,
      y: 0,
      incidenceWeight: 1.0,
    },
  ];

  const mockEdges: GraphEdge[] = [];
  const mockMasteries: Record<string, UserTopicMastery> = {};

  it('should render container with semantic accessibility role and label', () => {
    const html = renderToString(
      React.createElement(Constellation3DCanvas, {
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
    assert.ok(html.includes('aria-label="Universo 3D do Mapa de Revisão"'));
  });

  it('should render floating 3D controls for auto-rotation and camera reset', () => {
    const html = renderToString(
      React.createElement(Constellation3DCanvas, {
        nodes: mockNodes,
        edges: mockEdges,
        masteries: mockMasteries,
        selectedNodeId: null,
        highlightNodeIds: new Set<string>(),
        highlightEdgeIds: new Set<string>(),
        onSelectNode: () => {},
      }),
    );

    assert.ok(html.includes('Girar 360°'));
    assert.ok(html.includes('Recentralizar Universo'));
  });
});
