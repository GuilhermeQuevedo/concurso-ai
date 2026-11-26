import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MetasCard } from './MetasCard';
import type { DashboardSummary } from '../services/dashboard.service';

describe('MetasCard Component (Phase 7 — Batch 3)', () => {
  const mockGoal: DashboardSummary['goal'] = {
    dailyQuestions: 20,
    todayQuestions: 15,
    todayStudyMinutes: 45,
  };

  const mockAverages: DashboardSummary['averages'] = {
    questionsLast30: 450,
    questionsLast7: 120,
    activeDaysLast30: 25,
    perActiveDay: 18,
  };

  it('should render daily question progress, percentage and metrics grid', () => {
    const html = renderToString(
      React.createElement(MetasCard, {
        goal: mockGoal,
        averages: mockAverages,
        onSetGoal: () => {},
        saving: false,
      })
    );

    assert.ok(html.includes('Meta Diária'));
    assert.ok(html.includes('15'));
    assert.ok(html.includes('/20 questões'));
    assert.ok(html.includes('75%'));
    assert.ok(html.includes('Tempo Hoje'));
    assert.ok(html.includes('45min'));
    assert.ok(html.includes('Média / Dia Ativo'));
  });

  it('should render progress bar with accessibility attributes and smooth transition', () => {
    const html = renderToString(
      React.createElement(MetasCard, {
        goal: mockGoal,
        averages: mockAverages,
        onSetGoal: () => {},
        saving: false,
      })
    );

    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('aria-valuenow="75"'));
    assert.ok(html.includes('Progresso da meta diária de questões'));
  });

  it('should celebrate when daily goal is reached', () => {
    const reachedGoal = { ...mockGoal, todayQuestions: 22 };
    const html = renderToString(
      React.createElement(MetasCard, {
        goal: reachedGoal,
        averages: mockAverages,
        onSetGoal: () => {},
        saving: false,
      })
    );

    assert.ok(html.includes('Meta Batida! 🎉'));
    assert.ok(html.includes('aria-valuenow="100"'));
  });
});
