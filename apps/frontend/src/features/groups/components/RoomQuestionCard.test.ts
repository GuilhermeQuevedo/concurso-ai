import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { RoomQuestionCard } from './RoomQuestionCard';
import type { RoomQuestion } from '../services/room.service';

describe('RoomQuestionCard Component (Phase 5 — Batch 1)', () => {
  const mockRoomQuestion: RoomQuestion = {
    id: 'rq-1',
    index: 0,
    statement: 'A República Federativa do Brasil rege-se nas suas relações internacionais pela prevalência dos direitos humanos.',
    alternatives: [
      { letter: 'C', text: 'Certo' },
      { letter: 'E', text: 'Errado' },
    ],
    myChoice: null,
    reveal: null,
  };

  it('should render position, statement, and interactive alternatives with min touch height', () => {
    const html = renderToString(
      React.createElement(RoomQuestionCard, {
        question: mockRoomQuestion,
        position: 'Questão 3 / 10',
        canAnswer: true,
        pending: false,
        onAnswer: () => {},
      })
    );

    assert.ok(html.includes('Questão 3 / 10'));
    assert.ok(html.includes('relações internacionais'));
    assert.ok(html.includes('Certo'));
    assert.ok(html.includes('Errado'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('touch-manipulation'));
  });

  it('should render pending state when answer is being submitted', () => {
    const html = renderToString(
      React.createElement(RoomQuestionCard, {
        question: mockRoomQuestion,
        position: 'Questão 3 / 10',
        canAnswer: true,
        pending: true,
        onAnswer: () => {},
      })
    );

    assert.ok(html.includes('Enviando...'));
    assert.ok(html.includes('animate-spin'));
  });

  it('should render reveal state with official answer feedback', () => {
    const revealedQuestion: RoomQuestion = {
      ...mockRoomQuestion,
      myChoice: 'C',
      reveal: {
        correctAnswer: 'C',
        explanation: 'Art. 4º, II, CF/88.',
      },
    };

    const html = renderToString(
      React.createElement(RoomQuestionCard, {
        question: revealedQuestion,
        position: 'Questão 3 / 10',
        canAnswer: false,
        pending: false,
        onAnswer: () => {},
      })
    );

    assert.ok(html.includes('Gabarito oficial:'));
    assert.ok(html.includes('Alternativa'));
    assert.ok(html.includes('Art. 4º, II, CF/88.'));
    assert.ok(html.includes('border-emerald-500'));
  });
});
