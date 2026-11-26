import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FlashcardViewer, type ViewerCard } from './FlashcardViewer';

describe('FlashcardViewer Component (Phase 5 — Batch 3)', () => {
  const mockCards: ViewerCard[] = [
    {
      id: 'fc-1',
      front: 'Qual o quórum para aprovação de Emenda Constitucional?',
      back: '3/5 dos votos dos respectivos membros, em 2 turnos de votação em cada Casa.',
      explanation: 'Art. 60, § 2º, CF/88.',
    },
    {
      id: 'fc-2',
      front: 'O mandado de segurança coletivo pode ser impetrado por partido político sem representação no Congresso? (___)',
      back: 'Não, exige representação em pelo menos uma das Casas.',
    },
  ];

  it('should render question front, navigation controls, and flip prompt', () => {
    const html = renderToString(
      React.createElement(FlashcardViewer, {
        cards: mockCards,
        title: 'Controle de Constitucionalidade',
      })
    );

    assert.ok(html.includes('Qual o quórum para aprovação'));
    assert.ok(html.includes('Pergunta'));
    assert.ok(html.includes('Revelar Resposta'));
    assert.ok(html.includes('min-h-[48px]'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('Anterior'));
    assert.ok(html.includes('Pular'));
  });

  it('should render empty message when cards list is empty', () => {
    const html = renderToString(
      React.createElement(FlashcardViewer, {
        cards: [],
      })
    );

    assert.ok(html.includes('Nenhum flashcard disponível'));
  });
});
