import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScheduleWizard } from './ScheduleWizard';
import { ActiveStudyContext, type ActiveStudyValue } from '@/features/active-study/active-study-context';

describe('ScheduleWizard Component (Phase 6 — Batch 3)', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
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
        React.createElement(
          ActiveStudyContext.Provider,
          { value: mockActiveStudy },
          React.createElement(MemoryRouter, null, children)
        )
      );
  };

  it('should render 3 wizard numbered sections with titles and hints', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(ScheduleWizard, {
          loading: false,
          onGenerate: () => {},
        })
      )
    );

    assert.ok(html.includes('Escolha a prova e as matérias'));
    assert.ok(html.includes('Dias e limites de estudo'));
    assert.ok(html.includes('Meta semanal e distribuição diária'));
    assert.ok(html.includes('Gerar cronograma inteligente'));
  });

  it('should render action button with touch target and active scale', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(ScheduleWizard, {
          loading: false,
          onGenerate: () => {},
        })
      )
    );

    assert.ok(html.includes('min-h-[48px]'));
    assert.ok(html.includes('active:scale-[0.98]'));
    assert.ok(html.includes('touch-manipulation'));
  });

  it('should render loading state when loading is true', () => {
    const Wrapper = createWrapper();
    const html = renderToString(
      React.createElement(
        Wrapper,
        null,
        React.createElement(ScheduleWizard, {
          loading: true,
          onGenerate: () => {},
        })
      )
    );

    assert.ok(html.includes('Montando seu cronograma inteligente'));
    assert.ok(html.includes('role="status"'));
    assert.ok(html.includes('aria-busy="true"'));
  });
});
