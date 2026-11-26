import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NodeActionDrawer } from './NodeActionDrawer';
import type { GraphNode, UserTopicMastery } from '../types/map.types';

describe('NodeActionDrawer Component (Phase 5 — Node Action Panel)', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const mockTopic: GraphNode = {
    id: 'topic-1',
    name: 'Direitos Fundamentais',
    slug: 'direitos-fundamentais',
    level: 'TOPIC',
    levelLabel: 'Tópico',
    order: 1,
    description: 'Direitos e garantias fundamentais individuais e coletivos.',
    parentId: null,
    subjectId: 'sub-1',
    incidenceWeight: 3.5,
    x: 120,
    y: 180,
  };

  const mockMastery: UserTopicMastery = {
    topicId: 'topic-1',
    masteryScore: 78,
    state: 'MASTERED',
    stateLabel: 'Dominado',
    accuracy: 0.8,
    attemptsCount: 25,
    correctCount: 20,
    dueFlashcardsCount: 2,
    priorityScore: 15,
    lastAttemptAt: '2026-11-19T10:00:00Z',
    calculatedAt: '2026-11-19T10:00:00Z',
  };

  it('não deve renderizar nada quando isOpen for false', () => {
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(NodeActionDrawer, {
            isOpen: false,
            topic: mockTopic,
            mastery: mockMastery,
            onClose: () => {},
            onSelectConnectedTopic: () => {},
          }),
        ),
      ),
    );

    assert.equal(html, '');
  });

  it('deve renderizar o diálogo acessível com papel role="dialog" e aria-modal quando aberto', () => {
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(NodeActionDrawer, {
            isOpen: true,
            topic: mockTopic,
            mastery: mockMastery,
            onClose: () => {},
            onSelectConnectedTopic: () => {},
          }),
        ),
      ),
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('Direitos Fundamentais'));
    assert.ok(html.includes('Incidência: 3.5x na banca'));
    assert.ok(html.includes('cursor-pointer'));
  });
});
