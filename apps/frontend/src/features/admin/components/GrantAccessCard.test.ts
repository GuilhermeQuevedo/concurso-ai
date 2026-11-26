import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GrantAccessCard } from './GrantAccessCard';

describe('GrantAccessCard Component (Phase 7 — Batch 1)', () => {
  function renderWithQuery(ui: React.ReactElement): string {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return renderToString(
      React.createElement(QueryClientProvider, { client: queryClient }, ui)
    );
  }

  it('should render form fields with accessibility labels and placeholder', () => {
    const html = renderWithQuery(React.createElement(GrantAccessCard));

    assert.ok(html.includes('Liberar acesso manual'));
    assert.ok(html.includes('aluno@exemplo.com'));
    assert.ok(html.includes('aria-label="E-mail do beneficiário"'));
    assert.ok(html.includes('aria-label="Duração do acesso"'));
    assert.ok(html.includes('Liberar Acesso'));
  });

  it('should enforce 16px mobile font floor and Fitts Law touch targets', () => {
    const html = renderWithQuery(React.createElement(GrantAccessCard));

    assert.ok(html.includes('text-base sm:text-sm'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });
});
