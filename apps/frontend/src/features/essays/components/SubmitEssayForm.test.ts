import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubmitEssayForm } from './SubmitEssayForm';

describe('SubmitEssayForm Component (Phase 6 — Batch 2)', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  it('should render form with title, mode buttons and submit button', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(SubmitEssayForm, {
          onBack: () => {},
          onCreated: () => {},
        })
      )
    );

    assert.ok(html.includes('Nova Correção com IA'));
    assert.ok(html.includes('Dissertativa Argumentativa'));
    assert.ok(html.includes('Estudo de Caso / Prática'));
    assert.ok(html.includes('Enviar para Correção Especialista'));
  });

  it('should render touch targets compliant with Fitts Law and active scaling', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(SubmitEssayForm, {
          onBack: () => {},
          onCreated: () => {},
        })
      )
    );

    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('min-h-[48px]'));
    assert.ok(html.includes('active:scale-[0.98]'));
  });

  it('should render live statistics bar for words and lines in text mode', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(SubmitEssayForm, {
          onBack: () => {},
          onCreated: () => {},
        })
      )
    );

    assert.ok(html.includes('palavras'));
    assert.ok(html.includes('caracteres'));
    assert.ok(html.includes('linhas'));
  });
});
