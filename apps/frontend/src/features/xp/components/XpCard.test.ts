import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { XpCard } from './XpCard';
import type { XpSummary } from '../services/xp.service';

describe('XpCard Component (Phase 7 — Batch 1)', () => {
  const mockXpData: XpSummary = {
    totalXp: 4850,
    multiplier: 1.5,
    weekXp: 1200,
    level: {
      level: 12,
      tier: { name: 'Veterano', index: 3, minLevel: 10 },
      xpIntoLevel: 350,
      xpForNext: 500,
      progress: 0.7,
      maxed: false,
    },
    today: {
      total: 180,
      cap: 300,
      bySource: {
        QUESTION: { earned: 100, cap: 150 },
        FLASHCARD: { earned: 80, cap: 150 },
      },
    },
  };

  const createWrapper = (data: XpSummary | null = mockXpData) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    if (data) {
      queryClient.setQueryData(['xp-summary'], data);
    }
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  it('should render level, tier badge, and total XP', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(Wrapper, null, React.createElement(XpCard))
    );

    assert.ok(html.includes('Nível &amp; Experiência') || html.includes('Nível & Experiência'));
    assert.ok(html.includes('Veterano'));
    assert.ok(html.includes('Nv 12'));
    assert.ok(html.includes('4.850') || html.includes('4850'));
  });

  it('should render animated progress bar with proper accessibility attributes', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(Wrapper, null, React.createElement(XpCard))
    );

    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('aria-valuenow="70"'));
    assert.ok(html.includes('Progresso para o próximo nível'));
    assert.ok(html.includes('70%'));
  });

  it('should render offensive streak multiplier badge and touch target for details', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(Wrapper, null, React.createElement(XpCard))
    );

    assert.ok(html.includes('ofensiva'));
    assert.ok(html.includes('Hoje:'));
    assert.ok(html.includes('180'));
    assert.ok(html.includes('Detalhes'));
    assert.ok(html.includes('touch-manipulation'));
  });
});
