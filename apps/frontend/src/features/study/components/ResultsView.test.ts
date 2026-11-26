import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { ResultsView } from './ResultsView';
import type { QuestionDTO } from '@/features/questions/services/question.service';

describe('ResultsView Component (Phase 5 — Batch 3)', () => {
  const mockQuestions: QuestionDTO[] = [
    {
      id: 'q-1',
      statement: 'O princípio da legalidade é basilar ao Estado de Direito.',
      alternatives: [
        { letter: 'A', text: 'Sim' },
        { letter: 'B', text: 'Não' },
      ],
      correctAnswer: 'A',
      difficulty: 'EASY',
      explanation: 'Fundamentado no art. 5º, II da CF/88.',
      comments: [],
      subjectId: 'sub-1',
      examBoardId: null,
      source: 'CESPE',
      aiModel: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'q-2',
      statement: 'Atos discricionários não possuem qualquer limite legal.',
      alternatives: [
        { letter: 'A', text: 'Sim' },
        { letter: 'B', text: 'Não' },
      ],
      correctAnswer: 'B',
      difficulty: 'MEDIUM',
      explanation: 'Mesmo discricionários, estão limitados pela lei.',
      comments: [],
      subjectId: 'sub-1',
      examBoardId: null,
      source: 'CESPE',
      aiModel: null,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockStats = {
    total: 2,
    correct: 1,
    wrong: 1,
    accuracy: 50,
    totalTime: 95,
  };

  const mockStates = {
    'q-1': {
      selectedAnswer: 'A',
      result: { isCorrect: true, correctAnswer: 'A', explanation: '' } as any,
      timeSpent: 40,
      favorited: false,
      revealed: true,
      draft: '',
    },
    'q-2': {
      selectedAnswer: 'A',
      result: { isCorrect: false, correctAnswer: 'B', explanation: '' } as any,
      timeSpent: 55,
      favorited: false,
      revealed: true,
      draft: '',
    },
  };

  it('should render session stats cards, accuracy, and total time', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ResultsView, {
          stats: mockStats,
          questions: mockQuestions,
          questionStates: mockStates,
          onBack: () => {},
        })
      )
    );

    assert.ok(html.includes('Sessão Finalizada!'));
    assert.ok(html.includes('1/2'));
    assert.ok(html.includes('50%'));
    assert.ok(html.includes('1m 35s'));
    assert.ok(html.includes('Voltar aos simulados'));
  });

  it('should render Caderno de Erros banner when wrong answers exist', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ResultsView, {
          stats: mockStats,
          questions: mockQuestions,
          questionStates: mockStates,
          onBack: () => {},
        })
      )
    );

    assert.ok(html.includes('Caderno de Erros'));
    assert.ok(html.includes('Abrir Caderno de Erros'));
    assert.ok(html.includes('bg-amber-500'));
    assert.ok(html.includes('min-h-[44px]'));
  });
});
