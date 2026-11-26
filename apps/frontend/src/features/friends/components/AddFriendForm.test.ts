import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddFriendForm } from './AddFriendForm';

describe('AddFriendForm Component (Phase 8 — Batch 2)', () => {
  function createTestClient(): QueryClient {
    return new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  }

  it('should render form heading, input with accessible label and submit button', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(AddFriendForm)
      )
    );

    assert.ok(html.includes('Adicionar amigo'));
    assert.ok(html.includes('aria-label="Nickname ou código do amigo"'));
    assert.ok(html.includes('@nickname ou código'));
    assert.ok(html.includes('Adicionar'));
  });

  it('should enforce 16px mobile font floor and Fitts Law touch targets', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(AddFriendForm)
      )
    );

    assert.ok(html.includes('text-base sm:text-sm'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });
});
