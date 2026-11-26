import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { ActiveStudyBanner } from './ActiveStudyBanner';
import { ActiveStudyContext, type ActiveStudyValue } from './active-study-context';
import type { ContestSummary } from '@/features/contests/services/contest.service';

describe('ActiveStudyBanner Component (Phase 4 — Batch 3)', () => {
  const mockContest: ContestSummary = {
    id: 'contest-active-1',
    name: 'TCU - Auditor Federal',
    role: 'Auditor Federal de Controle Externo',
    organization: 'Tribunal de Contas da União',
    examBoard: 'Cebraspe',
    focus: null,
    examDate: '2027-10-15',
    status: 'STUDYING',
    totalTopics: 100,
    studiedTopics: 40,
    createdAt: new Date().toISOString(),
  };

  it('should render null when activeContest is null', () => {
    const mockValue: ActiveStudyValue = {
      contests: [],
      activeContestId: null,
      activeContest: null,
      setActiveContestId: () => {},
    };

    const html = renderToString(
      React.createElement(
        ActiveStudyContext.Provider,
        { value: mockValue },
        React.createElement(MemoryRouter, null, React.createElement(ActiveStudyBanner))
      )
    );

    assert.equal(html, '');
  });

  it('should render banner with active contest details, progress bar and touch targets', () => {
    const mockValue: ActiveStudyValue = {
      contests: [mockContest],
      activeContestId: mockContest.id,
      activeContest: mockContest,
      setActiveContestId: () => {},
    };

    const html = renderToString(
      React.createElement(
        ActiveStudyContext.Provider,
        { value: mockValue },
        React.createElement(MemoryRouter, null, React.createElement(ActiveStudyBanner))
      )
    );

    assert.ok(html.includes('TCU - Auditor Federal'));
    assert.ok(html.includes('Estudo Ativo'));
    assert.ok(html.includes('40'));
    assert.ok(html.includes('100'));
    assert.ok(html.includes('40%'));
    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('aria-valuenow="40"'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('Ver edital'));
  });
});
