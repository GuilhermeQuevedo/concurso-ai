import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DeckCard } from './DeckCard';
import type { DeckDTO } from '../services/flashcard.service';

describe('DeckCard Component (Phase 5 — Batch 3)', () => {
  const mockDeck: DeckDTO = {
    id: 'deck-1',
    name: 'Direito Constitucional - Direitos Fundamentais',
    topic: 'Art. 5º',
    color: '#3b82f6',
    total: 25,
    due: 5,
    confidence: 70,
    nextReview: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    subject: { id: 'sub-1', name: 'Direito Constitucional' },
  };

  it('should render deck name, subject, cards count and confidence progress bar', () => {
    const html = renderToString(
      React.createElement(DeckCard, {
        deck: mockDeck,
        onStudy: () => {},
        onEdit: () => {},
      })
    );

    assert.ok(html.includes('Direito Constitucional - Direitos Fundamentais'));
    assert.ok(html.includes('Art. 5º'));
    assert.ok(html.includes('cards'));
    assert.ok(html.includes('Confiança'));
    assert.ok(html.includes('70%'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('Estudar'));
  });

  it('should disable study button when deck has 0 cards', () => {
    const emptyDeck: DeckDTO = {
      ...mockDeck,
      total: 0,
      due: 0,
    };

    const html = renderToString(
      React.createElement(DeckCard, {
        deck: emptyDeck,
        onStudy: () => {},
        onEdit: () => {},
      })
    );

    assert.ok(html.includes('disabled=""'));
  });
});
