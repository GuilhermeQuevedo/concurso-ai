import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { RevealPiiModal } from './RevealPiiModal';

describe('RevealPiiModal Component (Phase 7 — Batch 1)', () => {
  it('should return null when isOpen is false', () => {
    const html = renderToString(
      React.createElement(RevealPiiModal, {
        isOpen: false,
        title: 'Visualizar Dados Pessoais',
        targetName: 'Carlos Silva',
        onClose: () => {},
        onConfirm: () => {},
      })
    );

    assert.equal(html, '');
  });

  it('should render dialog, LGPD warning and accessibility attributes when open', () => {
    const html = renderToString(
      React.createElement(RevealPiiModal, {
        isOpen: true,
        title: 'Visualizar Dados Pessoais',
        targetName: 'Carlos Silva',
        onClose: () => {},
        onConfirm: () => {},
      })
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('aria-labelledby="reveal-pii-title"'));
    assert.ok(html.includes('Visualizar Dados Pessoais'));
    assert.ok(html.includes('Carlos Silva'));
    assert.ok(html.includes('Aviso de Conformidade LGPD'));
    assert.ok(html.includes('10 caracteres'));
  });

  it('should enforce Fitts Law touch targets and mobile font floor', () => {
    const html = renderToString(
      React.createElement(RevealPiiModal, {
        isOpen: true,
        title: 'Visualizar Dados Pessoais',
        targetName: 'Carlos Silva',
        onClose: () => {},
        onConfirm: () => {},
      })
    );

    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('text-base sm:text-sm'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });
});
