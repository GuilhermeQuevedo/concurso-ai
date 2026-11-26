import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QuestionAlternative } from './QuestionAlternative';

describe('QuestionAlternative Component (Phase 5 — Batch 1)', () => {
  it('should render idle state with default borders and letter badge', () => {
    const html = renderToString(
      React.createElement(QuestionAlternative, {
        letter: 'A',
        text: 'O princípio da legalidade é expresso na CF/88.',
        state: 'idle',
        onClick: () => {},
      })
    );

    assert.ok(html.includes('A'));
    assert.ok(html.includes('O princípio da legalidade'));
    assert.ok(html.includes('border-gray-200'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('duration-fast'));
  });

  it('should render selected state with primary ring and aria-checked="true"', () => {
    const html = renderToString(
      React.createElement(QuestionAlternative, {
        letter: 'B',
        text: 'A administração pode revogar atos oportunos.',
        state: 'selected',
        onClick: () => {},
      })
    );

    assert.ok(html.includes('aria-checked="true"'));
    assert.ok(html.includes('ring-2'));
    assert.ok(html.includes('ring-primary-500'));
    assert.ok(html.includes('bg-primary-600'));
  });

  it('should render correct state with emerald ring and check icon', () => {
    const html = renderToString(
      React.createElement(QuestionAlternative, {
        letter: 'C',
        text: 'Gabarito correto confirmado.',
        state: 'correct',
        onClick: () => {},
      })
    );

    assert.ok(html.includes('border-emerald-500'));
    assert.ok(html.includes('bg-emerald-600'));
    assert.ok(html.includes('aria-checked="true"'));
  });

  it('should render wrong state with red ring and x icon', () => {
    const html = renderToString(
      React.createElement(QuestionAlternative, {
        letter: 'D',
        text: 'Alternativa incorreta selecionada.',
        state: 'wrong',
        onClick: () => {},
      })
    );

    assert.ok(html.includes('border-red-500'));
    assert.ok(html.includes('bg-red-600'));
  });

  it('should render muted state when option was not picked after answer is revealed', () => {
    const html = renderToString(
      React.createElement(QuestionAlternative, {
        letter: 'E',
        text: 'Alternativa irrelevante.',
        state: 'muted',
        disabled: true,
        onClick: () => {},
      })
    );

    assert.ok(html.includes('opacity-60'));
    assert.ok(html.includes('disabled=""'));
  });
});
