import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { GenerationProgressModal } from './GenerationProgressModal';

describe('GenerationProgressModal Component (Phase 6 — Batch 1)', () => {
  it('should not render anything when open is false', () => {
    const html = renderToString(
      React.createElement(GenerationProgressModal, {
        open: false,
        quantity: 10,
        subjectName: 'Direito Constitucional',
      })
    );

    assert.equal(html, '');
  });

  it('should render accessible dialog and progress bar when open is true', () => {
    const html = renderToString(
      React.createElement(GenerationProgressModal, {
        open: true,
        quantity: 10,
        subjectName: 'Direito Constitucional',
      })
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('aria-labelledby="generation-title"'));
    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('Gerando Simulado Inteligente'));
    assert.ok(html.includes('Direito Constitucional'));
  });

  it('should display generation stages with icons and descriptions', () => {
    const html = renderToString(
      React.createElement(GenerationProgressModal, {
        open: true,
        quantity: 15,
      })
    );

    assert.ok(html.includes('Lendo o conteúdo'));
    assert.ok(html.includes('Elaborando <!-- -->15<!-- --> questões') || html.includes('Elaborando 15 questões'));
    assert.ok(html.includes('Conferindo os gabaritos'));
    assert.ok(html.includes('Montando o seu treino'));
  });
});
