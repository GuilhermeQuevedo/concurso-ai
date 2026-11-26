import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { WeakPointsModal } from './WeakPointsModal';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

describe('WeakPointsModal Component (FASE 8 — Modos de Valor)', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'node-1',
      name: 'Controle de Constitucionalidade',
      slug: 'controle-constitucionalidade',
      level: 'TOPIC',
      levelLabel: 'Tópico',
      order: 1,
      description: null,
      parentId: null,
      subjectId: 'sub-1',
      incidenceWeight: 9,
      x: 0,
      y: 0,
    },
  ];

  const mockOverlay: Record<string, UserTopicMastery> = {
    'node-1': {
      topicId: 'node-1',
      masteryScore: 15,
      state: 'IN_PROGRESS',
      stateLabel: 'Em andamento',
      accuracy: 10,
      attemptsCount: 10,
      correctCount: 1,
      dueFlashcardsCount: 2,
      priorityScore: 0.9,
      lastAttemptAt: null,
      calculatedAt: '2026-11-19T00:00:00Z',
    },
  };

  it('não deve renderizar nada se isOpen for false', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        {},
        React.createElement(WeakPointsModal, {
          isOpen: false,
          nodes: mockNodes,
          overlay: mockOverlay,
          onClose: () => {},
          onFocusTopicOnMap: () => {},
        }),
      ),
    );

    assert.equal(html, '');
  });

  it('deve renderizar modal acessível com ranking de pontos fracos e ações rápidas', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        {},
        React.createElement(WeakPointsModal, {
          isOpen: true,
          nodes: mockNodes,
          overlay: mockOverlay,
          onClose: () => {},
          onFocusTopicOnMap: () => {},
        }),
      ),
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('Revisar Meus Pontos Fracos'));
    assert.ok(html.includes('Controle de Constitucionalidade'));
    assert.ok(html.includes('Tópico'));
    assert.ok(html.includes('Ver no Mapa'));
    assert.ok(html.includes('Resolver Questões'));
    assert.ok(html.includes('Revisar Flashcards'));
    assert.ok(html.includes('cursor-pointer'));
  });
});
