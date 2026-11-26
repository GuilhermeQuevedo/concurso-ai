import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GenerateAIModal } from './GenerateAIModal';

describe('GenerateAIModal Component (Phase 6 — Batch 1)', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  it('should render dialog with accessibility attributes and title', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(GenerateAIModal, {
          onClose: () => {},
          onCreated: () => {},
        })
      )
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('aria-labelledby="generate-ai-title"'));
    assert.ok(html.includes('Gerador de Simulados Especialistas'));
  });

  it('should render popular exam boards and quantity selector with touch targets', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(GenerateAIModal, {
          onClose: () => {},
          onCreated: () => {},
        })
      )
    );

    assert.ok(html.includes('CEBRASPE'));
    assert.ok(html.includes('FGV'));
    assert.ok(html.includes('FCC'));
    assert.ok(html.includes('Quantidade de Questões'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('min-h-[44px]'));
  });

  it('should render submit button with proper styling and accessible label', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(GenerateAIModal, {
          onClose: () => {},
          onCreated: () => {},
        })
      )
    );

    assert.ok(html.includes('Gerar Simulado Especialista'));
    assert.ok(html.includes('h-12'));
    assert.ok(html.includes('active:scale-[0.99]'));
  });
});
