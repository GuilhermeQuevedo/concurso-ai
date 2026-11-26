import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ConstanciaMonth, dateKey, monthTitle } from './ConstanciaMonth';

describe('ConstanciaMonth Component (Phase 7 — Batch 1)', () => {
  it('should render calendar grid with weekdays and accessibility attributes', () => {
    const today = new Date(2026, 10, 19);
    const counts = new Map<string, number>();
    counts.set(dateKey(today), 5);

    const html = renderToString(
      React.createElement(ConstanciaMonth, {
        year: 2026,
        month: 10,
        today,
        counts,
        shielded: new Set<string>(),
      })
    );

    assert.ok(html.includes('role="grid"'));
    assert.ok(html.includes('Calendário de constância de'));
    assert.ok(html.includes('D'));
    assert.ok(html.includes('S'));
    assert.ok(html.includes('T'));
    assert.ok(html.includes('Q'));
  });

  it('should render flame for study day and shield for protected day with touch micro-interactions', () => {
    const today = new Date(2026, 10, 19);
    const studyDay = new Date(2026, 10, 15);
    const shieldedDay = new Date(2026, 10, 16);

    const counts = new Map<string, number>();
    counts.set(dateKey(studyDay), 8);

    const shielded = new Set<string>();
    shielded.add(dateKey(shieldedDay));

    const html = renderToString(
      React.createElement(ConstanciaMonth, {
        year: 2026,
        month: 10,
        today,
        counts,
        shielded,
      })
    );

    assert.ok(html.includes('8 atividade(s) registrada(s)'));
    assert.ok(html.includes('Escudo protegeu a ofensiva'));
    assert.ok(html.includes('hover:scale-105'));
    assert.ok(html.includes('active:scale-95'));
    assert.ok(html.includes('touch-manipulation'));
  });

  it('should format month title and date keys accurately', () => {
    const title = monthTitle(2026, 10);
    assert.ok(title.toLowerCase().includes('novembro'));
    assert.ok(title.includes('2026'));

    const key = dateKey(new Date(2026, 0, 5));
    assert.equal(key, '2026-01-05');
  });
});
