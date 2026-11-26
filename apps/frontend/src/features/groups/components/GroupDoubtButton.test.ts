import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GroupDoubtButton } from './GroupDoubtButton';

describe('GroupDoubtButton Component (Phase 8 — Batch 3)', () => {
  function createTestClient(): QueryClient {
    return new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  }

  it('should render trigger button with accessible label and icon', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(GroupDoubtButton, {
          targetType: 'QUESTION',
          targetId: 'q-101',
          context: 'Enunciado de exemplo de Direito Administrativo.',
        })
      )
    );

    assert.ok(html.includes('Tirar dúvida com o grupo'));
    assert.ok(html.includes('text-[#2E8C82]'));
    assert.ok(html.includes('min-h-[44px]'));
  });
});
