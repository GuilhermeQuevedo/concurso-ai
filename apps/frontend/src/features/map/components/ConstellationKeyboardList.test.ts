import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ConstellationKeyboardList } from './ConstellationKeyboardList';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

describe('ConstellationKeyboardList Component (Phase 4 — Batch 2 WCAG AA)', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'node-1',
      name: 'Princípios Administrativos',
      slug: 'principios-adm',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 1,
      description: null,
      parentId: null,
      subjectId: 'sub-1',
      incidenceWeight: 2.0,
      x: 100,
      y: 100,
    },
    {
      id: 'node-2',
      name: 'Legalidade e Impessoalidade',
      slug: 'legalidade-impessoalidade',
      level: 'SUBTOPIC',
      levelLabel: 'Subtópico',
      order: 2,
      description: null,
      parentId: 'node-1',
      subjectId: 'sub-1',
      incidenceWeight: 1.5,
      x: 200,
      y: 100,
    },
  ];

  const mockMasteries: Record<string, UserTopicMastery> = {
    'node-1': {
      topicId: 'node-1',
      masteryScore: 85,
      state: 'MASTERED',
      stateLabel: 'Dominado',
      accuracy: 0.85,
      attemptsCount: 20,
      correctCount: 17,
      dueFlashcardsCount: 3,
      priorityScore: 10,
      lastAttemptAt: null,
      calculatedAt: '2026-11-19T10:00:00Z',
    },
  };

  it('deve renderizar a estrutura semântica acessível com role region e list', () => {
    const html = renderToString(
      React.createElement(ConstellationKeyboardList, {
        nodes: mockNodes,
        masteries: mockMasteries,
        selectedNodeId: null,
        onSelectNode: () => {},
      }),
    );

    assert.ok(html.includes('role="region"'));
    assert.ok(html.includes('aria-label="Lista textual acessível de tópicos de revisão"'));
    assert.ok(html.includes('role="list"'));
    assert.ok(html.includes('role="listitem"'));
    assert.ok(html.includes('Princípios Administrativos'));
    assert.ok(html.includes('Legalidade e Impessoalidade'));
  });

  it('deve renderizar rótulos humanos e contagem de flashcards vencidos', () => {
    const html = renderToString(
      React.createElement(ConstellationKeyboardList, {
        nodes: mockNodes,
        masteries: mockMasteries,
        selectedNodeId: 'node-1',
        onSelectNode: () => {},
      }),
    );

    assert.ok(html.includes('85%'));
    assert.ok(html.includes('Dominado'));
    assert.ok(html.includes('3'));
    assert.ok(html.includes('flashcards vencidos'));
    assert.ok(html.includes('aria-selected="true"'));
    assert.ok(html.includes('cursor-pointer'));
  });
});
