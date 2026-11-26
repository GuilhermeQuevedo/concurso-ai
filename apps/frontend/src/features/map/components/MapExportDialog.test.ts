import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MapExportDialog } from './MapExportDialog';
import type { GraphNode, GraphEdge } from '../types/map.types';

describe('MapExportDialog Component (FASE 8 — Modos de Valor)', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'n1',
      name: 'Direito Administrativo',
      slug: 'direito-administrativo',
      level: 'DISCIPLINE',
      levelLabel: 'Disciplina',
      order: 1,
      description: null,
      parentId: null,
      subjectId: 'sub-1',
      incidenceWeight: 8,
      x: 0,
      y: 0,
    },
  ];

  const mockEdges: GraphEdge[] = [];

  it('não deve renderizar nada se isOpen for false', () => {
    const html = renderToString(
      React.createElement(MapExportDialog, {
        isOpen: false,
        nodes: mockNodes,
        edges: mockEdges,
        onClose: () => {},
      }),
    );

    assert.equal(html, '');
  });

  it('deve renderizar modal com abas de PNG, Markdown e Link LGPD', () => {
    const html = renderToString(
      React.createElement(MapExportDialog, {
        isOpen: true,
        nodes: mockNodes,
        edges: mockEdges,
        onClose: () => {},
      }),
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('Exportar e Compartilhar Mapa'));
    assert.ok(html.includes('Imagem PNG'));
    assert.ok(html.includes('Markdown (Obsidian)'));
    assert.ok(html.includes('Link Público'));
    assert.ok(html.includes('cursor-pointer'));
  });
});
