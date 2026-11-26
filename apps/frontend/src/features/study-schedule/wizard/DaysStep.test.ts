import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DaysStep } from './DaysStep';
import { DEFAULT_DAY_LIMITS } from './schedule-wizard.model';

describe('DaysStep Component (Phase 6 — Batch 3)', () => {
  it('should render preset template buttons with touch targets and descriptions', () => {
    const html = renderToString(
      React.createElement(DaysStep, {
        days: DEFAULT_DAY_LIMITS,
        onChange: () => {},
      })
    );

    assert.ok(html.includes('Reta final'));
    assert.ok(html.includes('Dedicação integral'));
    assert.ok(html.includes('Ritmo leve'));
    assert.ok(html.includes('h / semana') || html.includes('h/semana'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('min-h-[56px]'));
  });

  it('should render all weekdays with toggle and minutes limits', () => {
    const html = renderToString(
      React.createElement(DaysStep, {
        days: DEFAULT_DAY_LIMITS,
        onChange: () => {},
      })
    );

    assert.ok(html.includes('Seg'));
    assert.ok(html.includes('Ter'));
    assert.ok(html.includes('Qua'));
    assert.ok(html.includes('Qui'));
    assert.ok(html.includes('Sex'));
    assert.ok(html.includes('Sáb'));
    assert.ok(html.includes('Dom'));
    assert.ok(html.includes('Mín'));
    assert.ok(html.includes('Máx'));
  });

  it('should calculate and display total weekly capacity', () => {
    const html = renderToString(
      React.createElement(DaysStep, {
        days: DEFAULT_DAY_LIMITS,
        onChange: () => {},
      })
    );

    assert.ok(html.includes('Capacidade semanal configurada'));
    assert.ok(html.includes('estudo líquido'));
  });
});
