import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConstellationSatellites } from './ConstellationSatellites';
import type { UserTopicMastery } from '../types/map.types';

describe('ConstellationSatellites Component (Phase 4 — Batch 2 Satellites in Focus)', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const mockMastery: UserTopicMastery = {
    topicId: 'topic-1',
    masteryScore: 65,
    state: 'IN_PROGRESS',
    stateLabel: 'Em andamento',
    accuracy: 0.65,
    attemptsCount: 14,
    correctCount: 9,
    dueFlashcardsCount: 4,
    priorityScore: 50,
    lastAttemptAt: '2026-11-19T08:00:00Z',
    calculatedAt: '2026-11-19T10:00:00Z',
  };

  it('deve renderizar o título do tópico e o indicador de foco ativo', () => {
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(ConstellationSatellites, {
            topicId: 'topic-1',
            topicName: 'Controle de Constitucionalidade',
            mastery: mockMastery,
            onClose: () => {},
          }),
        ),
      ),
    );

    assert.ok(html.includes('Tópico em Foco'));
    assert.ok(html.includes('Controle de Constitucionalidade'));
    assert.ok(html.includes('65%'));
    assert.ok(html.includes('Em andamento'));
    assert.ok(html.includes('aria-label="Satélites e ações para o tópico Controle de Constitucionalidade"'));
  });

  it('deve exibir satélite de flashcards vencidos com contagem e cursor-pointer', () => {
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(ConstellationSatellites, {
            topicId: 'topic-1',
            topicName: 'Controle de Constitucionalidade',
            mastery: mockMastery,
            onClose: () => {},
          }),
        ),
      ),
    );

    assert.ok(html.includes('4 flashcards vencidos'));
    assert.ok(html.includes('Revisar'));
    assert.ok(html.includes('cursor-pointer'));
  });
});
