import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BankOriginBadge } from './BankOriginBadge';
import type { QuestionDTO } from '../services/question.service';

describe('BankOriginBadge Component', () => {
  it('returns null when question source is not BANK', () => {
    const question = {
      id: 'q1',
      statement: 'Texto',
      source: 'AI',
      alternatives: [],
    } as unknown as QuestionDTO;

    const html = renderToString(React.createElement(BankOriginBadge, { question }));
    assert.equal(html, '');
  });

  it('renders badge with Verde-Revisão styling and details when source is BANK', () => {
    const question = {
      id: 'q2',
      statement: 'Texto da banca',
      source: 'BANK',
      examBoard: { name: 'Cebraspe' },
      examYear: 2024,
      organ: 'SEEDF',
      position: 'Professor',
      alternatives: [],
    } as unknown as QuestionDTO;

    const html = renderToString(React.createElement(BankOriginBadge, { question }));
    assert.ok(html.includes('role="note"'));
    assert.ok(html.includes('Questão de banca'));
    assert.ok(html.includes('Cebraspe'));
    assert.ok(html.includes('2024'));
    assert.ok(html.includes('SEEDF'));
    assert.ok(html.includes('Professor'));
    assert.ok(html.includes('#2E8C82'));
  });
});
