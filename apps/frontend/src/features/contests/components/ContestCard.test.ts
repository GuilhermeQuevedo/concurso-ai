import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ContestCard, daysUntil, formatExamDate } from './ContestCard';
import type { ContestSummary } from '../services/contest.service';

describe('ContestCard Component & Date Helpers (Phase 4 — Batch 2)', () => {
  describe('daysUntil & formatExamDate', () => {
    it('should format ISO date YYYY-MM-DD into Brazilian DD/MM/YYYY format', () => {
      assert.equal(formatExamDate('2026-12-25'), '25/12/2026');
      assert.equal(formatExamDate('2027-01-05'), '05/01/2027');
    });

    it('should calculate daysUntil correctly for future dates', () => {
      const target = new Date();
      target.setDate(target.getDate() + 5);
      const year = target.getFullYear();
      const month = String(target.getMonth() + 1).padStart(2, '0');
      const day = String(target.getDate()).padStart(2, '0');
      const iso = `${year}-${month}-${day}`;
      assert.equal(daysUntil(iso), 5);
    });

    it('should return null when date is not provided', () => {
      assert.equal(daysUntil(null), null);
    });
  });

  describe('ContestCard Rendering', () => {
    const mockContest: ContestSummary = {
      id: 'contest-1',
      name: 'Receita Federal - Auditor Fiscal',
      role: 'Auditor-Fiscal da Receita Federal',
      organization: 'Receita Federal',
      examBoard: 'FGV',
      focus: null,
      examDate: '2027-06-15',
      status: 'STUDYING',
      totalTopics: 50,
      studiedTopics: 25,
      createdAt: new Date().toISOString(),
    };

    it('should render contest name, exam board, role and progress bar', () => {
      const html = renderToString(
        React.createElement(ContestCard, {
          contest: mockContest,
          onOpen: () => {},
          onToggleDone: () => {},
        }),
      );

      assert.ok(html.includes('Receita Federal - Auditor Fiscal'));
      assert.ok(html.includes('FGV'));
      assert.ok(html.includes('15/06/2027'));
      assert.ok(html.includes('role="progressbar"'));
      assert.ok(html.includes('tópicos'));
      assert.ok(html.includes('duration-fast'));
      assert.ok(html.includes('ease-standard'));
    });

    it('should render completed state with strike-through and badge when status is DONE', () => {
      const doneContest: ContestSummary = {
        ...mockContest,
        status: 'DONE',
      };

      const html = renderToString(
        React.createElement(ContestCard, {
          contest: doneContest,
          onOpen: () => {},
          onToggleDone: () => {},
        }),
      );

      assert.ok(html.includes('line-through'));
      assert.ok(html.includes('Concluído'));
      assert.ok(html.includes('Reabrir edital'));
    });
  });
});
