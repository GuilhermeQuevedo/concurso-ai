import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ScheduleCard } from './ScheduleCard';
import type { StudySchedule } from '../types';

describe('ScheduleCard Component (Phase 4 — Batch 3)', () => {
  const mockSchedule: StudySchedule = {
    id: 'sched-1',
    dailyHours: 4,
    subjects: ['Direito Constitucional', 'Direito Administrativo', 'Português'],
    examDate: '2027-08-20',
    schedule: {
      title: 'Plano Intensivo Auditor',
      weeks: [],
    },
  };

  it('should render schedule title, daily hours and subjects count', () => {
    const html = renderToString(
      React.createElement(ScheduleCard, {
        schedule: mockSchedule,
        onClick: () => {},
        onDelete: () => {},
        onRename: () => {},
      })
    );

    assert.ok(html.includes('Plano Intensivo Auditor'));
    assert.ok(html.includes('h por dia'));
    assert.ok(html.includes('matérias'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('duration-fast'));
    assert.ok(html.includes('ease-standard'));
  });

  it('should render accessible action buttons for rename and delete', () => {
    const html = renderToString(
      React.createElement(ScheduleCard, {
        schedule: mockSchedule,
        onClick: () => {},
        onDelete: () => {},
        onRename: () => {},
      })
    );

    assert.ok(html.includes('aria-label="Renomear cronograma"'));
    assert.ok(html.includes('aria-label="Excluir cronograma"'));
    assert.ok(html.includes('min-h-[44px]'));
  });

  it('should fallback to default title when title is not provided in schedule object', () => {
    const scheduleWithoutTitle: StudySchedule = {
      ...mockSchedule,
      schedule: {
        weeks: [],
      },
    };

    const html = renderToString(
      React.createElement(ScheduleCard, {
        schedule: scheduleWithoutTitle,
        onClick: () => {},
        onDelete: () => {},
        onRename: () => {},
      })
    );

    assert.ok(html.includes('Prova em 20/08/2027'));
  });
});
