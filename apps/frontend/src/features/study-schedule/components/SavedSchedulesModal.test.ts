import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SavedSchedulesModal } from './SavedSchedulesModal';
import type { StudySchedule } from '../types';

describe('SavedSchedulesModal Component (Phase 4 — Batch 3)', () => {
  const mockSchedules: StudySchedule[] = [
    {
      id: 'sched-1',
      dailyHours: 3,
      subjects: ['Português', 'RLM'],
      examDate: '2027-09-10',
      contestId: 'contest-1',
      contest: { id: 'contest-1', name: 'Polícia Federal' },
      schedule: {
        title: 'Cronograma PF 2027',
        weeks: [],
      },
    },
    {
      id: 'sched-2',
      dailyHours: 2,
      subjects: ['Direito Penal'],
      examDate: '2027-11-15',
      contestId: null,
      contest: null,
      schedule: {
        title: 'Cronograma Avulso Penal',
        weeks: [],
      },
    },
  ];

  it('should render dialog container with accessibility attributes', () => {
    const html = renderToString(
      React.createElement(SavedSchedulesModal, {
        schedules: mockSchedules,
        onSelect: () => {},
        onRename: async () => true,
        onDelete: () => {},
        onClose: () => {},
      })
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('aria-labelledby="saved-schedules-title"'));
    assert.ok(html.includes('Cronogramas Salvos'));
    assert.ok(html.includes('aria-label="Fechar"'));
    assert.ok(html.includes('backdrop-blur-xs'));
    assert.ok(html.includes('duration-slow'));
  });

  it('should render grouped sections and filter tabs when multiple edital categories exist', () => {
    const html = renderToString(
      React.createElement(SavedSchedulesModal, {
        schedules: mockSchedules,
        onSelect: () => {},
        onRename: async () => true,
        onDelete: () => {},
        onClose: () => {},
      })
    );

    assert.ok(html.includes('role="tablist"'));
    assert.ok(html.includes('Todos'));
    assert.ok(html.includes('Polícia Federal'));
    assert.ok(html.includes('Cronograma PF 2027'));
    assert.ok(html.includes('Cronograma Avulso Penal'));
  });

  it('should render empty state message when schedule list is empty', () => {
    const html = renderToString(
      React.createElement(SavedSchedulesModal, {
        schedules: [],
        onSelect: () => {},
        onRename: async () => true,
        onDelete: () => {},
        onClose: () => {},
      })
    );

    assert.ok(html.includes('Nenhum cronograma encontrado'));
  });
});
