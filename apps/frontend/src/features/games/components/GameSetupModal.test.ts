import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { GameSetupModal } from './GameSetupModal';
import type { DeckDTO } from '@/features/flashcards/services/flashcard.service';
import type { QuestionSetSummary } from '@/features/questions/services/question-set.service';

describe('GameSetupModal Component (Phase 8 — Batch 4)', () => {
  const mockDecks: DeckDTO[] = [
    {
      id: 'deck-1',
      name: 'Direito Constitucional',
      topic: 'Controle de Constitucionalidade',
      color: '#2E8C82',
      total: 10,
      due: 3,
      confidence: 85,
      nextReview: '2026-11-25T10:00:00Z',
      createdAt: '2026-11-20T10:00:00Z',
      subject: { id: 'sub-1', name: 'Constitucional' },
    },
    {
      id: 'deck-2',
      name: 'Vazio',
      topic: null,
      color: '#2E8C82',
      total: 2,
      due: 0,
      confidence: 100,
      nextReview: null,
      createdAt: '2026-11-20T10:00:00Z',
      subject: null,
    },
  ];

  const mockSets: QuestionSetSummary[] = [
    {
      id: 'set-1',
      name: 'Simulado Geral 2026',
      mode: 'EXAM',
      questionType: 'MULTIPLE_5',
      createdAt: '2026-11-20T10:00:00Z',
      lastAttemptAt: null,
      total: 20,
      answered: 5,
      subject: { id: 'sub-2', name: 'Administrativo' },
    },
  ];

  const mockSubjects = [
    { id: 'sub-1', name: 'Constitucional', prefix: '' },
    { id: 'sub-2', name: 'Administrativo', prefix: '' },
  ];

  it('should render dialog with accessibility attributes and deck options for MEMORIA', () => {
    const html = renderToString(
      React.createElement(GameSetupModal, {
        game: 'MEMORIA',
        title: 'Memória Pareada',
        decks: mockDecks,
        sets: mockSets,
        subjects: mockSubjects,
        starting: false,
        onStart: () => {},
        onTrilhaMap: () => {},
        onClose: () => {},
      })
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('Memória Pareada'));
    assert.ok(html.includes('Todos os meus flashcards'));
    assert.ok(html.includes('Direito Constitucional'));
    assert.ok(html.includes('Jogar Agora'));
  });

  it('should render question set options for DUELO and enforce Fitts Law touch targets', () => {
    const html = renderToString(
      React.createElement(GameSetupModal, {
        game: 'DUELO',
        title: 'Duelo Relâmpago',
        decks: mockDecks,
        sets: mockSets,
        subjects: mockSubjects,
        starting: false,
        onStart: () => {},
        onTrilhaMap: () => {},
        onClose: () => {},
      })
    );

    assert.ok(html.includes('Duelo Relâmpago'));
    assert.ok(html.includes('Todas as minhas questões'));
    assert.ok(html.includes('Simulado Geral 2026'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });
});
