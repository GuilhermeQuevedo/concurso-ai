import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateManualModal } from './CreateManualModal';

describe('CreateManualModal Component (Phase 6 — Batch 1)', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  it('should render step 1 with accessibility attributes, title and inputs', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(CreateManualModal, {
          onClose: () => {},
          onCreated: () => {},
        })
      )
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('aria-labelledby="manual-modal-title"'));
    assert.ok(html.includes('Criar Deck Manual'));
    assert.ok(html.includes('Nome do Deck'));
    assert.ok(html.includes('Tipo de Questão'));
  });

  it('should render kind options with responsive touch targets and touch-manipulation', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(CreateManualModal, {
          onClose: () => {},
          onCreated: () => {},
        })
      )
    );

    assert.ok(html.includes('Múltipla Escolha'));
    assert.ok(html.includes('Certo/Errado'));
    assert.ok(html.includes('Subjetiva'));
    assert.ok(html.includes('Variadas'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('min-h-[44px]'));
  });

  it('should render next step button with active scale and accessible touch target', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(CreateManualModal, {
          onClose: () => {},
          onCreated: () => {},
        })
      )
    );

    assert.ok(html.includes('Próximo: Adicionar Questões'));
    assert.ok(html.includes('min-h-[48px]'));
    assert.ok(html.includes('active:scale-[0.98]'));
  });
});
