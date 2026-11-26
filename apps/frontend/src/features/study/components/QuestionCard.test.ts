import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QuestionCard } from './QuestionCard';
import type { QuestionDTO } from '@/features/questions/services/question.service';

describe('QuestionCard Component (Phase 5 — Batch 1)', () => {
  const mockQuestion: QuestionDTO = {
    id: 'q-101',
    statement: 'Em relação ao controle de constitucionalidade difuso no Brasil, assinale a opção correta.',
    alternatives: [
      { letter: 'A', text: 'Pode ser exercido por qualquer juiz ou tribunal.' },
      { letter: 'B', text: 'Produz sempre efeitos erga omnes imediatos.' },
      { letter: 'C', text: 'Exige quórum de 2/3 dos membros do STF.' },
    ],
    correctAnswer: 'A',
    difficulty: 'MEDIUM',
    explanation: 'O controle difuso pode ser exercido por qualquer órgão jurisdicional singular ou colegiado.',
    comments: [],
    subjectId: 'sub-1',
    examBoardId: null,
    source: 'CESPE 2024',
    aiModel: null,
    createdAt: new Date().toISOString(),
  };

  it('should render question metadata, statement, and alternatives', () => {
    const html = renderToString(
      React.createElement(QuestionCard, {
        question: mockQuestion,
        index: 0,
        total: 10,
        format: 'MULTIPLE',
        selectedAnswer: null,
        isAnswered: false,
        showFeedback: false,
        isFavorited: false,
        isSubmitting: false,
        mode: 'STUDY',
        onSelectAlternative: () => {},
        onConfirmAnswer: () => {},
        onToggleFavorite: () => {},
      })
    );

    assert.ok(html.includes('Questão'));
    assert.ok(html.includes('Múltipla escolha'));
    assert.ok(html.includes('controle de constitucionalidade difuso'));
    assert.ok(html.includes('Pode ser exercido por qualquer juiz ou tribunal.'));
    assert.ok(html.includes('Responder e Ver Resposta'));
    assert.ok(html.includes('h-12'));
  });

  it('should disable submit button when no alternative is selected', () => {
    const html = renderToString(
      React.createElement(QuestionCard, {
        question: mockQuestion,
        index: 0,
        total: 5,
        format: 'MULTIPLE',
        selectedAnswer: null,
        isAnswered: false,
        showFeedback: false,
        isFavorited: false,
        isSubmitting: false,
        mode: 'STUDY',
        onSelectAlternative: () => {},
        onConfirmAnswer: () => {},
        onToggleFavorite: () => {},
      })
    );

    assert.ok(html.includes('disabled=""'));
  });

  it('should display loading state with spinner and aria-busy when submitting', () => {
    const html = renderToString(
      React.createElement(QuestionCard, {
        question: mockQuestion,
        index: 0,
        total: 5,
        format: 'MULTIPLE',
        selectedAnswer: 'A',
        isAnswered: false,
        showFeedback: false,
        isFavorited: false,
        isSubmitting: true,
        mode: 'STUDY',
        onSelectAlternative: () => {},
        onConfirmAnswer: () => {},
        onToggleFavorite: () => {},
      })
    );

    assert.ok(html.includes('aria-busy="true"'));
    assert.ok(html.includes('Conferindo com a banca...'));
    assert.ok(html.includes('animate-spin'));
  });

  it('should reflect favorited state on star button', () => {
    const html = renderToString(
      React.createElement(QuestionCard, {
        question: mockQuestion,
        index: 0,
        total: 5,
        format: 'MULTIPLE',
        selectedAnswer: null,
        isAnswered: false,
        showFeedback: false,
        isFavorited: true,
        isSubmitting: false,
        mode: 'STUDY',
        onSelectAlternative: () => {},
        onConfirmAnswer: () => {},
        onToggleFavorite: () => {},
      })
    );

    assert.ok(html.includes('Favoritada'));
    assert.ok(html.includes('Remover dos favoritos'));
    assert.ok(html.includes('bg-amber-50'));
  });
});
