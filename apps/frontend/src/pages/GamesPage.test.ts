import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { GamesPage } from './GamesPage';

describe('GamesPage Component (Phase 8 — Batch 4)', () => {
  const mockOverview = {
    earnedToday: 150,
    dailyCap: 400,
    games: [
      { game: 'DUELO', best: 80, plays: 5 },
      { game: 'MEMORIA', best: 120, plays: 8 },
      { game: 'TRILHA', best: 0, plays: 0 },
      { game: 'PONTA', best: 0, plays: 0 },
      { game: 'RESGATE', best: 60, plays: 2 },
    ],
  };

  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(['games', 'overview'], mockOverview);
    client.setQueryData(['subjects'], []);
    client.setQueryData(['flashcard-decks'], []);
    client.setQueryData(['question-sets'], []);
    return client;
  }

  it('should render page title, daily XP counter and cognitive game cards', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(GamesPage)
        )
      )
    );

    assert.ok(html.includes('Jogos Cognitivos'));
    assert.ok(html.includes('150/400 XP'));
    assert.ok(html.includes('Duelo Relâmpago'));
    assert.ok(html.includes('Memória Pareada'));
    assert.ok(html.includes('Trilha do Saber'));
    assert.ok(html.includes('Na Ponta da Língua'));
    assert.ok(html.includes('Resgate da Memória'));
  });

  it('should render neuroscience badges, stats and enforce Fitts Law touch targets', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(GamesPage)
        )
      )
    );

    assert.ok(html.includes('Recordação ativa e atenção'));
    assert.ok(html.includes('Memória semântica em rede'));
    assert.ok(html.includes('Melhor: 80 pts · 5 partidas'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });
});
