import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { GettingStartedPage } from './GettingStartedPage';

describe('GettingStartedPage Component (Phase 9 — Batch 1)', () => {
  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(['subjects'], [{ id: 'sub-1', name: 'Direito' }]);
    client.setQueryData(['exam-boards'], [{ id: 'brd-1', name: 'Cebraspe' }]);
    client.setQueryData(['user-stats'], { totalSessions: 3 });
    client.setQueryData(['flashcard-stats'], { total: 12 });
    client.setQueryData(['documents'], []);
    return client;
  }

  it('should render page title, onboarding steps, and progress indicator', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(GettingStartedPage)
        )
      )
    );

    assert.ok(html.includes('Como alimentar a plataforma'));
    assert.ok(html.includes('Seu progresso de configuração'));
    assert.ok(html.includes('Cadastre suas disciplinas'));
    assert.ok(html.includes('Cadastre as bancas'));
    assert.ok(html.includes('Gere questões com IA'));
    assert.ok(html.includes('Central de Ajuda'));
  });

  it('should enforce Fitts Law touch targets and brand button styling', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(GettingStartedPage)
        )
      )
    );

    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });
});
