import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TopicReviews } from './TopicReviews';
import type { SyllabusItem } from '../services/contest.service';

describe('TopicReviews Component (Phase 7 — Batch 2)', () => {
  const mockItem: SyllabusItem = {
    id: 'syl-1',
    contestId: 'contest-1',
    subjectId: 'subject-1',
    discipline: 'Direito Constitucional',
    topic: 'Direitos Fundamentais',
    studied: true,
    order: 1,
    focus: false,
    importance: 5,
    firstStudiedAt: '2026-11-09T10:00:00Z',
    reviews: [
      {
        id: 'rev-item-1',
        index: 0,
        scheduledFor: '2026-11-10T10:00:00Z',
        completedAt: '2026-11-10T11:00:00Z',
        intervalDays: 1,
      },
      {
        id: 'rev-item-2',
        index: 1,
        scheduledFor: new Date().toISOString(),
        completedAt: null,
        intervalDays: 7,
      },
      {
        id: 'rev-item-3',
        index: 2,
        scheduledFor: new Date(Date.now() + 86400000 * 20).toISOString(),
        completedAt: null,
        intervalDays: 30,
      },
    ],
  };

  it('should not render anything if item is not studied or has no reviews', () => {
    const unstudied = { ...mockItem, studied: false };
    const html = renderToString(
      React.createElement(TopicReviews, { item: unstudied, onComplete: () => {} })
    );

    assert.equal(html, '');
  });

  it('should render interval buttons with delight status and touch targets', () => {
    const html = renderToString(
      React.createElement(TopicReviews, { item: mockItem, onComplete: () => {} })
    );

    assert.ok(html.includes('+1d'));
    assert.ok(html.includes('+7d'));
    assert.ok(html.includes('+30d'));
    assert.ok(html.includes('min-h-[36px]'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('active:scale-95'));
  });

  it('should highlight due reviews for today with count badge', () => {
    const html = renderToString(
      React.createElement(TopicReviews, { item: mockItem, onComplete: () => {} })
    );

    assert.ok(html.includes('1 hoje'));
    assert.ok(html.includes('Pendente hoje'));
  });
});
