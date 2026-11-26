import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { SimuladoViewer, type SimuladoQuestionItem } from './SimuladoViewer';

describe('SimuladoViewer Component (Phase 5 — Batch 2)', () => {
  const mockQuestions: SimuladoQuestionItem[] = [
    {
      id: 'sq-1',
      statement: 'O princípio da impessoalidade veda a promoção pessoal de agentes públicos.',
      referenceText: 'Art. 37, § 1º, da CF/88.',
      alternatives: [
        { letter: 'C', text: 'Certo' },
        { letter: 'E', text: 'Errado' },
      ],
      correctAnswer: 'C',
      explanation: 'A publicidade dos atos não pode conter nomes, símbolos ou imagens.',
    },
    {
      id: 'sq-2',
      statement: 'Os atos administrativos gozam de presunção absoluta de legitimidade.',
      alternatives: [
        { letter: 'C', text: 'Certo' },
        { letter: 'E', text: 'Errado' },
      ],
      correctAnswer: 'E',
      explanation: 'A presunção é relativa (juris tantum).',
    },
  ];

  it('should render active question, statement, alternatives and navigation buttons', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(SimuladoViewer, {
          questions: mockQuestions,
          title: 'Simulado Direito Administrativo',
        })
      )
    );

    assert.ok(html.includes('Simulado Direito Administrativo'));
    assert.ok(html.includes('princípio da impessoalidade'));
    assert.ok(html.includes('role="radiogroup"'));
    assert.ok(html.includes('min-h-[48px]'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('Próxima'));
    assert.ok(html.includes('Anterior'));
  });

  it('should render warning state when questions array is empty', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(SimuladoViewer, {
          questions: [],
        })
      )
    );

    assert.ok(html.includes('Nenhuma questão disponível'));
  });
});
