import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SyllabusTreeView } from './SyllabusTreeView';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

describe('SyllabusTreeView Component (Phase 6 — Tree View)', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'disc-1',
      name: 'Direito Constitucional',
      slug: 'dir-const',
      level: 'DISCIPLINE',
      levelLabel: 'Disciplina',
      order: 1,
      description: null,
      parentId: null,
      subjectId: 'sub-1',
      incidenceWeight: 3.5,
      x: 0,
      y: 0,
    },
    {
      id: 'top-1',
      name: 'Poder Executivo',
      slug: 'poder-executivo',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 1,
      description: null,
      parentId: 'disc-1',
      subjectId: 'sub-1',
      incidenceWeight: 2.0,
      x: 100,
      y: 100,
    },
  ];

  const mockMasteries: Record<string, UserTopicMastery> = {
    'disc-1': {
      topicId: 'disc-1',
      masteryScore: 70,
      state: 'IN_PROGRESS',
      stateLabel: 'Em andamento',
      accuracy: 0.7,
      attemptsCount: 15,
      correctCount: 10,
      dueFlashcardsCount: 2,
      priorityScore: 30,
      lastAttemptAt: '2026-11-19T10:00:00Z',
      calculatedAt: '2026-11-19T10:00:00Z',
    },
  };

  it('deve renderizar a estrutura semântica da árvore com role="tree"', () => {
    const html = renderToString(
      React.createElement(SyllabusTreeView, {
        nodes: mockNodes,
        masteries: mockMasteries,
        selectedNodeId: null,
        onSelectNode: () => {},
        onFocusOnMap: () => {},
      }),
    );

    assert.ok(html.includes('role="tree"'));
    assert.ok(html.includes('aria-label="Árvore estruturada de tópicos do edital"'));
    assert.ok(html.includes('Direito Constitucional'));
    assert.ok(html.includes('Poder Executivo'));
    assert.ok(html.includes('Expandir'));
    assert.ok(html.includes('Recolher'));
  });

  it('deve incluir campo de busca e botões com cursor-pointer', () => {
    const html = renderToString(
      React.createElement(SyllabusTreeView, {
        nodes: mockNodes,
        masteries: mockMasteries,
        selectedNodeId: 'disc-1',
        onSelectNode: () => {},
        onFocusOnMap: () => {},
      }),
    );

    assert.ok(html.includes('placeholder="Filtrar tópicos por nome na árvore do edital..."'));
    assert.ok(html.includes('cursor-pointer'));
  });
});
