import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Textarea } from './textarea';

describe('Textarea Component (Phase 3)', () => {
  it('should render textarea with anti-zoom font sizing and duration-fast transition', () => {
    const html = renderToString(
      React.createElement(Textarea, { placeholder: 'Escreva sua redação...' }),
    );

    assert.ok(html.includes('min-h-[96px]'));
    assert.ok(html.includes('duration-fast'));
    assert.ok(html.includes('ease-standard'));
    assert.ok(html.includes('text-base'));
    assert.ok(html.includes('sm:text-sm'));
    assert.ok(html.includes('placeholder="Escreva sua redação..."'));
  });

  it('should render inline error message and alert role when errorMessage is provided', () => {
    const html = renderToString(
      React.createElement(Textarea, {
        errorMessage: 'O texto deve conter no mínimo 20 linhas',
      }),
    );

    assert.ok(html.includes('aria-invalid="true"'));
    assert.ok(html.includes('role="alert"'));
    assert.ok(html.includes('border-red-500'));
    assert.ok(html.includes('O texto deve conter no mínimo 20 linhas'));
  });
});
