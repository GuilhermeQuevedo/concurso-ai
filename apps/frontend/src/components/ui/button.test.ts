import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Button } from './button';

describe('Button Component (Phase 2)', () => {
  it('should render default button with motion-safe classes and instant duration', () => {
    const html = renderToString(React.createElement(Button, null, 'Clique aqui'));

    assert.ok(html.includes('duration-instant'));
    assert.ok(html.includes('ease-standard'));
    assert.ok(html.includes('active:scale-[0.98]'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('Clique aqui'));
  });

  it('should render destructive variant with appropriate styling', () => {
    const html = renderToString(
      React.createElement(Button, { variant: 'destructive' }, 'Excluir'),
    );

    assert.ok(html.includes('bg-red-600'));
    assert.ok(html.includes('focus-visible:ring-red-500'));
    assert.ok(html.includes('Excluir'));
  });

  it('should enforce min-h-[44px] for mobile touch target compliance with Fitts Law', () => {
    const html = renderToString(React.createElement(Button, { size: 'default' }, 'Toque'));

    assert.ok(html.includes('min-h-[44px]'));
  });

  it('should render spinner and set aria-busy when isLoading is true', () => {
    const html = renderToString(
      React.createElement(
        Button,
        { isLoading: true, loadingText: 'Salvando...' },
        'Salvar',
      ),
    );

    assert.ok(html.includes('aria-busy="true"'));
    assert.ok(html.includes('disabled=""'));
    assert.ok(html.includes('animate-spin'));
    assert.ok(html.includes('Salvando...'));
    assert.ok(!html.includes('>Salvar<'));
  });

  it('should respect disabled attribute', () => {
    const html = renderToString(
      React.createElement(Button, { disabled: true }, 'Desabilitado'),
    );

    assert.ok(html.includes('disabled=""'));
    assert.ok(html.includes('disabled:pointer-events-none'));
  });
});
