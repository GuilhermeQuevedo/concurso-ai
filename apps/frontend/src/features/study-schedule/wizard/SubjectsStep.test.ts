import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SubjectsStep } from './SubjectsStep';
import type { WizardSubject } from './schedule-wizard.model';

describe('SubjectsStep Component (Phase 6 — Batch 3)', () => {
  const mockSubjects: WizardSubject[] = [
    { name: 'Direito Constitucional', importance: 5, difficulty: 3 },
    { name: 'Língua Portuguesa', importance: 4, difficulty: 2 },
  ];

  it('should render subject cards with level pickers for importance and difficulty', () => {
    const html = renderToString(
      React.createElement(SubjectsStep, {
        subjects: mockSubjects,
        onChange: () => {},
      })
    );

    assert.ok(html.includes('Direito Constitucional'));
    assert.ok(html.includes('Língua Portuguesa'));
    assert.ok(html.includes('Importância na Prova'));
    assert.ok(html.includes('Minha Dificuldade'));
  });

  it('should render level picker buttons with touch targets and active scale', () => {
    const html = renderToString(
      React.createElement(SubjectsStep, {
        subjects: mockSubjects,
        onChange: () => {},
      })
    );

    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('active:scale-95'));
    assert.ok(html.includes('aria-label="Importância na Prova 5"'));
    assert.ok(html.includes('aria-label="Minha Dificuldade 3"'));
  });

  it('should render add subject input and button with accessible touch target', () => {
    const html = renderToString(
      React.createElement(SubjectsStep, {
        subjects: mockSubjects,
        onChange: () => {},
      })
    );

    assert.ok(html.includes('Nome de outra matéria do edital...'));
    assert.ok(html.includes('Adicionar'));
    assert.ok(html.includes('min-h-[44px]'));
  });
});
