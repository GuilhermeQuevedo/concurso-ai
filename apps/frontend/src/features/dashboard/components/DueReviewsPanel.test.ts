import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DueReviewsPanel } from './DueReviewsPanel';
import { ActiveStudyContext, type ActiveStudyValue } from '@/features/active-study/active-study-context';
import type { DueReview } from '@/features/contests/services/contest.service';

describe('DueReviewsPanel Component (Phase 7 — Batch 2)', () => {
  const mockReviews: DueReview[] = [
    {
      id: 'rev-1',
      index: 1,
      intervalDays: 7,
      syllabusItemId: 'syl-1',
      topic: 'Controle de Constitucionalidade',
      discipline: 'Direito Constitucional',
      contestId: 'contest-1',
      contestName: 'TCU Auditor',
      overdue: false,
      scheduledFor: new Date().toISOString(),
    },
    {
      id: 'rev-2',
      index: 2,
      intervalDays: 30,
      syllabusItemId: 'syl-2',
      topic: 'Atos Administrativos e Anulação',
      discipline: 'Direito Administrativo',
      contestId: 'contest-1',
      contestName: 'TCU Auditor',
      overdue: true,
      scheduledFor: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const createWrapper = (reviews: DueReview[] = mockReviews) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['due-reviews'], reviews);

    const mockActiveStudy: ActiveStudyValue = {
      contests: [],
      activeContestId: null,
      activeContest: null,
      setActiveContestId: () => {},
    };

    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(ActiveStudyContext.Provider, { value: mockActiveStudy }, children)
      );
  };

  it('should render panel header with count badge and review topics', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(Wrapper, null, React.createElement(DueReviewsPanel))
    );

    assert.ok(html.includes('Revisões de Hoje'));
    assert.ok(html.includes('2 pendentes'));
    assert.ok(html.includes('Controle de Constitucionalidade'));
    assert.ok(html.includes('Atos Administrativos'));
  });

  it('should render overdue indicator for late reviews and action buttons with touch targets', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(Wrapper, null, React.createElement(DueReviewsPanel))
    );

    assert.ok(html.includes('atrasada'));
    assert.ok(html.includes('Revisei'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('min-h-[38px]'));
    assert.ok(html.includes('active:scale-95'));
  });

  it('should render delight empty state when all reviews are completed', () => {
    const Wrapper = createWrapper([]);
    const html = renderToString(
      React.createElement(Wrapper, null, React.createElement(DueReviewsPanel))
    );

    assert.ok(html.includes('Tudo em dia por aqui!'));
    assert.ok(html.includes('Você venceu a curva do esquecimento'));
  });
});
