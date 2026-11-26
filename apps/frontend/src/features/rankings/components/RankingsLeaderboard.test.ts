import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RankingsLeaderboard } from './RankingsLeaderboard';

describe('RankingsLeaderboard Component (Phase 7 — Batch 2)', () => {
  const mockLeaderboard = {
    board: {
      id: 'board-1',
      title: 'Liga de Elite — Direito Constitucional',
      description: 'Disputa semanal dos 100 melhores concurseiros',
    },
    joined: true,
    entries: [
      {
        userId: 'user-1',
        name: 'Carlos Oliveira',
        position: 1,
        score: 1850,
        correct: 150,
        total: 160,
        streak: 25,
        level: 20,
        tier: 'Mestre',
        isCurrentUser: false,
      },
      {
        userId: 'user-2',
        name: 'Mariana Souza',
        position: 2,
        score: 1620,
        correct: 130,
        total: 145,
        streak: 18,
        level: 16,
        tier: 'Veterano',
        isCurrentUser: true,
      },
      {
        userId: 'user-3',
        name: 'Rafael Lima',
        position: 3,
        score: 1400,
        correct: 110,
        total: 130,
        streak: 12,
        level: 14,
        tier: 'Veterano',
        isCurrentUser: false,
      },
    ],
  };

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['rankings', 'board-1', 'leaderboard'], mockLeaderboard);

    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  it('should render leaderboard title, podium positions and user names', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(Wrapper, null, React.createElement(RankingsLeaderboard, { rankingId: 'board-1' }))
    );

    assert.ok(html.includes('Liga de Elite — Direito Constitucional'));
    assert.ok(html.includes('Carlos Oliveira'));
    assert.ok(html.includes('Mariana Souza'));
    assert.ok(html.includes('Rafael Lima'));
    assert.ok(html.includes('Você'));
  });

  it('should render metrics for accuracy, streak, score and tier badges', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(Wrapper, null, React.createElement(RankingsLeaderboard, { rankingId: 'board-1' }))
    );

    assert.ok(html.includes('150/160'));
    assert.ok(html.includes('25'));
    assert.ok(html.includes('1850 pts'));
    assert.ok(html.includes('Mestre'));
    assert.ok(html.includes('Veterano'));
  });

  it('should render join/leave toggle button with touch manipulation and active scale', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(Wrapper, null, React.createElement(RankingsLeaderboard, { rankingId: 'board-1' }))
    );

    assert.ok(html.includes('Sair do Ranking'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('active:scale-[0.98]'));
  });
});
