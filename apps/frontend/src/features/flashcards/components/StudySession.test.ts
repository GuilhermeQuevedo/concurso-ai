import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { StudySession } from './StudySession';
import type { DeckDTO, FlashcardDTO } from '../services/flashcard.service';

describe('StudySession Component (Phase 5 — Batch 3)', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockDeck: DeckDTO = {
    id: 'deck-study-1',
    name: 'Direito Penal - Teoria do Crime',
    topic: 'Fato Típico',
    color: '#ef4444',
    subject: { id: 'sub-penal', name: 'Direito Penal' },
    total: 10,
    due: 3,
    confidence: 50,
    nextReview: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const mockCards: FlashcardDTO[] = [
    {
      id: 'card-1',
      userId: 'user-1',
      subjectId: 'sub-penal',
      front: 'Quais são os elementos do fato típico?',
      back: 'Conduta, resultado, nexo causal e tipicidade.',
      easeFactor: 2.5,
      interval: 1,
      repetition: 0,
      nextReview: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  it('should render flashcard front, deck name, and touch targets in study shell', () => {
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(StudySession, {
            deck: mockDeck,
            cards: mockCards,
            onExit: () => {},
          })
        )
      )
    );

    assert.ok(html.includes('Direito Penal - Teoria do Crime'));
    assert.ok(html.includes('Quais são os elementos do fato típico?'));
    assert.ok(html.includes('Pergunta'));
    assert.ok(html.includes('min-h-[260px]'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('Toque no card ou aperte Espaço'));
  });
});
