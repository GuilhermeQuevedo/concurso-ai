import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  statusOf,
  StatusBadge,
  StatusFilter,
  type DisciplineStatus,
} from './DisciplineStatus';

describe('DisciplineStatus & Filter Components (Phase 4 — Batch 2)', () => {
  describe('statusOf Helper', () => {
    it('should return pending when studied is 0', () => {
      assert.equal(statusOf(0, 10), 'pending');
    });

    it('should return in_progress when some topics are studied but not all', () => {
      assert.equal(statusOf(3, 10), 'in_progress');
      assert.equal(statusOf(9, 10), 'in_progress');
    });

    it('should return completed when all topics are studied', () => {
      assert.equal(statusOf(10, 10), 'completed');
      assert.equal(statusOf(15, 10), 'completed');
    });
  });

  describe('StatusBadge Component', () => {
    it('should render null for pending status to reduce cognitive noise (Hick Law)', () => {
      const html = renderToString(React.createElement(StatusBadge, { status: 'pending' }));
      assert.equal(html, '');
    });

    it('should render correct label and styling for in_progress', () => {
      const html = renderToString(React.createElement(StatusBadge, { status: 'in_progress' }));
      assert.ok(html.includes('Em andamento'));
      assert.ok(html.includes('bg-amber-50'));
    });

    it('should render correct label and styling for completed', () => {
      const html = renderToString(React.createElement(StatusBadge, { status: 'completed' }));
      assert.ok(html.includes('Concluída'));
      assert.ok(html.includes('bg-emerald-50'));
    });
  });

  describe('StatusFilter Component', () => {
    it('should render filter pills with total and status counts', () => {
      const counts: Record<DisciplineStatus, number> = {
        pending: 3,
        in_progress: 2,
        completed: 5,
      };

      const html = renderToString(
        React.createElement(StatusFilter, {
          counts,
          value: 'all',
          onChange: () => {},
        }),
      );

      assert.ok(html.includes('Todas'));
      assert.ok(html.includes('10')); // 3 + 2 + 5 = 10
      assert.ok(html.includes('aria-pressed="true"'));
      assert.ok(html.includes('touch-manipulation'));
      assert.ok(html.includes('duration-instant'));
    });
  });
});
