import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AnalysisModal, currentStep } from './AnalysisModal';

describe('AnalysisModal Component', () => {
  it('correctly calculates step progression based on elapsed seconds', () => {
    assert.equal(currentStep(0), 0);
    assert.equal(currentStep(5), 0);
    assert.equal(currentStep(6), 1);
    assert.equal(currentStep(17), 1);
    assert.equal(currentStep(18), 2);
    assert.equal(currentStep(39), 2);
    assert.equal(currentStep(40), 3);
    assert.equal(currentStep(100), 3);
  });

  it('renders modal dialog when open is true', () => {
    const html = renderToString(
      React.createElement(AnalysisModal, {
        open: true,
        error: null,
        inParts: false,
        firstPages: null,
        onCancel: () => {},
        onClose: () => {},
      })
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('Analisando com Inteligência Artificial'));
    assert.ok(html.includes('#2E8C82'));
  });

  it('renders error state when error is provided', () => {
    const html = renderToString(
      React.createElement(AnalysisModal, {
        open: false,
        error: 'Falha no processamento do PDF.',
        inParts: false,
        firstPages: null,
        onCancel: () => {},
        onClose: () => {},
      })
    );

    assert.ok(html.includes('Não foi possível concluir a análise'));
    assert.ok(html.includes('Falha no processamento do PDF.'));
  });
});
