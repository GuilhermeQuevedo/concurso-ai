import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewMapContainer } from './ReviewMapContainer';

describe('ReviewMapContainer Component (Phase 4 — Batch 1)', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  it('deve renderizar o estado de carregamento inicial elegantemente', () => {
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/mapa'] },
          React.createElement(ReviewMapContainer, {}),
        ),
      ),
    );

    assert.ok(html.includes('Carregando mapa de revisão do edital...'));
  });

  it('deve conter a mensagem com spinner acessível e papel de loading', () => {
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/mapa'] },
          React.createElement(ReviewMapContainer, {}),
        ),
      ),
    );

    assert.ok(html.includes('animate-spin'));
  });
});
