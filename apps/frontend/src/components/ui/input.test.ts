import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Input } from './input';

describe('Input Component (Phase 3)', () => {
  it('should render standard input with mobile touch target and duration-fast', () => {
    const html = renderToString(
      React.createElement(Input, { placeholder: 'Digite seu nome' }),
    );

    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('duration-fast'));
    assert.ok(html.includes('ease-standard'));
    assert.ok(html.includes('placeholder="Digite seu nome"'));
  });

  it('should render error message and set aria-invalid when errorMessage is provided', () => {
    const html = renderToString(
      React.createElement(Input, {
        errorMessage: 'E-mail inválido',
        defaultValue: 'teste@',
      }),
    );

    assert.ok(html.includes('aria-invalid="true"'));
    assert.ok(html.includes('role="alert"'));
    assert.ok(html.includes('border-red-500'));
    assert.ok(html.includes('E-mail inválido'));
  });

  it('should render helper text with aria-describedby when provided without error', () => {
    const html = renderToString(
      React.createElement(Input, {
        id: 'user-cpf',
        helperText: 'Apenas números',
      }),
    );

    assert.ok(html.includes('aria-describedby="user-cpf-helper"'));
    assert.ok(html.includes('Apenas números'));
  });
});
