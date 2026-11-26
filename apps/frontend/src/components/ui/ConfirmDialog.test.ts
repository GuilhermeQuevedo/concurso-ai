import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog Component (Phase 2)', () => {
  it('should render dialog with title, message and action buttons', () => {
    const html = renderToString(
      React.createElement(ConfirmDialog, {
        title: 'Excluir documento',
        message: 'Tem certeza de que deseja apagar este arquivo permanentemente?',
        confirmLabel: 'Excluir',
        cancelLabel: 'Voltar',
        onCancel: () => {},
        onConfirm: () => {},
      }),
    );

    assert.ok(html.includes('role="alertdialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('Excluir documento'));
    assert.ok(html.includes('Tem certeza de que deseja apagar este arquivo permanentemente?'));
    assert.ok(html.includes('Excluir'));
    assert.ok(html.includes('Voltar'));
    assert.ok(html.includes('backdrop-blur-xs'));
    assert.ok(html.includes('duration-slow'));
  });

  it('should reflect pending state on action buttons', () => {
    const html = renderToString(
      React.createElement(ConfirmDialog, {
        title: 'Excluir documento',
        message: 'Aguarde o processamento...',
        isPending: true,
        confirmLabel: 'Excluir',
        onCancel: () => {},
        onConfirm: () => {},
      }),
    );

    assert.ok(html.includes('aria-busy="true"'));
    assert.ok(html.includes('animate-spin'));
  });
});
