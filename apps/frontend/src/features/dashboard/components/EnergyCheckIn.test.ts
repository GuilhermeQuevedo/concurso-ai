import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { EnergyCheckIn } from './EnergyCheckIn';

describe('EnergyCheckIn Component (Phase 7 — Batch 3)', () => {
  it('should render energy check-in question and options when unselected', () => {
    const html = renderToString(
      React.createElement(EnergyCheckIn, { dailyGoal: 20 })
    );

    assert.ok(html.includes('Como está sua energia hoje?'));
    assert.ok(html.includes('Leve'));
    assert.ok(html.includes('Normal'));
    assert.ok(html.includes('Pesado'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('min-h-[56px]'));
  });

  it('should render accessible region role and label', () => {
    const html = renderToString(
      React.createElement(EnergyCheckIn, { dailyGoal: 30 })
    );

    assert.ok(html.includes('role="region"'));
    assert.ok(html.includes('aria-label="Check-in diário de energia e disposição"'));
  });
});
