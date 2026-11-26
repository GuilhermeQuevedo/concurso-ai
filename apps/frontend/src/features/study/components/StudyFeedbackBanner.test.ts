import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StudyFeedbackBanner } from './StudyFeedbackBanner';

describe('StudyFeedbackBanner Component (Phase 5 — Batch 2)', () => {
  it('should render success feedback with emerald styles when isCorrect is true', () => {
    const html = renderToString(
      React.createElement(StudyFeedbackBanner, {
        isCorrect: true,
        correctAnswer: 'A',
        explanation: 'Comentário da questão acertada.',
      })
    );

    assert.ok(html.includes('Parabéns, você acertou!'));
    assert.ok(html.includes('Gabarito oficial:'));
    assert.ok(html.includes('Alternativa'));
    assert.ok(html.includes('bg-emerald-600'));
    assert.ok(html.includes('border-emerald-300'));
    assert.ok(html.includes('Ver Explicação'));
    assert.ok(html.includes('min-h-[44px]'));
  });

  it('should render error feedback with red styles when isCorrect is false', () => {
    const html = renderToString(
      React.createElement(StudyFeedbackBanner, {
        isCorrect: false,
        correctAnswer: 'D',
        explanation: 'Comentário da questão errada.',
      })
    );

    assert.ok(html.includes('Você errou esta questão.'));
    assert.ok(html.includes('Alternativa'));
    assert.ok(html.includes('bg-red-600'));
    assert.ok(html.includes('border-red-300'));
  });
});
