import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AchievementsPage } from './AchievementsPage';

describe('AchievementsPage Component (Phase 8 — Batch 1)', () => {
  const mockProfile = {
    streak: { current: 14, longest: 30 },
    availableAchievements: [
      {
        type: 'FIRST_QUESTION',
        name: 'Primeiro Passo',
        description: 'Responda sua primeira questão na plataforma.',
        unlocked: true,
        unlockedAt: '2026-11-10T12:00:00Z',
      },
      {
        type: 'STREAK_7',
        name: 'Constância de Bronze',
        description: 'Mantenha 7 dias consecutivos de estudo ativo.',
        unlocked: true,
        unlockedAt: '2026-11-17T12:00:00Z',
      },
      {
        type: 'STREAK_30',
        name: 'Constância de Ouro',
        description: 'Mantenha 30 dias consecutivos de estudo ativo.',
        unlocked: false,
        unlockedAt: null,
      },
    ],
  };

  function createTestClient(): QueryClient {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(['gamification-profile'], mockProfile);
    return client;
  }

  it('should render page title, streak KPI cards and progress bar', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(AchievementsPage)
      )
    );

    assert.ok(html.includes('Conquistas'));
    assert.ok(html.includes('Dias seguidos'));
    assert.ok(html.includes('14'));
    assert.ok(html.includes('Maior sequência'));
    assert.ok(html.includes('30'));
    assert.ok(html.includes('Progresso Geral'));
    assert.ok(html.includes('concluído'));
  });

  it('should render unlocked and locked achievements correctly', () => {
    const client = createTestClient();
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(AchievementsPage)
      )
    );

    assert.ok(html.includes('Primeiro Passo'));
    assert.ok(html.includes('Constância de Bronze'));
    assert.ok(html.includes('Constância de Ouro'));
    assert.ok(html.includes('Desbloqueada em'));
    assert.ok(html.includes('bg-[#2E8C82]'));
    assert.ok(html.includes('#F2A93B'));
  });
});
