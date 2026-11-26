import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SyllabusTreeNode } from './SyllabusTreeNode';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

describe('SyllabusTreeNode Component (Phase 6 — Tree View)', () => {
  const mockNode: GraphNode = {
    id: 'topic-1',
    name: 'Direito Administrativo',
    slug: 'dir-adm',
    level: 'DISCIPLINE',
    levelLabel: 'Disciplina',
    order: 1,
    description: null,
    parentId: null,
    subjectId: 'sub-1',
    incidenceWeight: 3.2,
    x: 0,
    y: 0,
  };

  const mockMastery: UserTopicMastery = {
    topicId: 'topic-1',
    masteryScore: 80,
    state: 'MASTERED',
    stateLabel: 'Dominado',
    accuracy: 0.8,
    attemptsCount: 30,
    correctCount: 24,
    dueFlashcardsCount: 5,
    priorityScore: 20,
    lastAttemptAt: '2026-11-19T10:00:00Z',
    calculatedAt: '2026-11-19T10:00:00Z',
  };

  it('deve renderizar o nó com papel role="treeitem" e atributos do edital', () => {
    const html = renderToString(
      React.createElement(SyllabusTreeNode, {
        node: mockNode,
        depth: 0,
        hasChildren: true,
        isExpanded: true,
        isSelected: false,
        mastery: mockMastery,
        onToggleExpand: () => {},
        onSelect: () => {},
        onFocusOnMap: () => {},
      }),
    );

    assert.ok(html.includes('role="treeitem"'));
    assert.ok(html.includes('aria-expanded="true"'));
    assert.ok(html.includes('Direito Administrativo'));
    assert.ok(html.includes('Disciplina'));
    assert.ok(html.includes('80% dominado'));
    assert.ok(html.includes('Incidência: 3.2x'));
  });

  it('deve renderizar botão para focar no grafo e contagem de flashcards vencidos', () => {
    const html = renderToString(
      React.createElement(SyllabusTreeNode, {
        node: mockNode,
        depth: 0,
        hasChildren: true,
        isExpanded: false,
        isSelected: true,
        mastery: mockMastery,
        onToggleExpand: () => {},
        onSelect: () => {},
        onFocusOnMap: () => {},
      }),
    );

    assert.ok(html.includes('No Grafo'));
    assert.ok(html.includes('5'));
    assert.ok(html.includes('flashcards para revisar hoje'));
    assert.ok(html.includes('cursor-pointer'));
  });
});
