import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { GeneratePage } from './GeneratePage';

describe('GeneratePage Component (Phase 5 — Batch 4)', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  it('should render page title, action buttons, view toggles and filter', () => {
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(GeneratePage)
        )
      )
    );

    assert.ok(html.includes('Questões &amp; Simulados') || html.includes('Questões & Simulados'));
    assert.ok(html.includes('Criar Manual'));
    assert.ok(html.includes('Gerar com IA'));
    assert.ok(html.includes('Filtrar'));
    assert.ok(html.includes('min-h-[44px]'));
  });
});
