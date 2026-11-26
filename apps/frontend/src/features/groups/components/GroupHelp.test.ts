import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GroupHelp } from './GroupHelp';

describe('GroupHelp Component (Phase 8 — Batch 3)', () => {
  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(['group-comments', 'grp-1', 'all', '', false], []);
    return client;
  }

  it('should render doubt context textarea, checkbox filter and empty state', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(GroupHelp, {
          groupId: 'grp-1',
          canModerate: false,
        })
      )
    );

    assert.ok(html.includes('aria-label="Contexto da dúvida"'));
    assert.ok(html.includes('Mostrar apenas dúvidas em aberto'));
    assert.ok(html.includes('Nenhuma conversa iniciada ainda'));
  });

  it('should enforce 16px mobile font floor and accessible controls', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(GroupHelp, {
          groupId: 'grp-1',
          canModerate: false,
        })
      )
    );

    assert.ok(html.includes('text-base sm:text-sm'));
    assert.ok(html.includes('min-h-[80px]'));
  });
});
