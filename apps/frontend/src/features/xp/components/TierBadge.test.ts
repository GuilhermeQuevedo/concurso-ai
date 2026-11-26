import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TierBadge } from './TierBadge';

describe('TierBadge Component (Phase 7 — Batch 1)', () => {
  it('should render tier name and level number with delight icon', () => {
    const html = renderToString(
      React.createElement(TierBadge, {
        level: 5,
        tier: 'Aplicado',
      })
    );

    assert.ok(html.includes('Nv 5'));
    assert.ok(html.includes('Aplicado'));
    assert.ok(html.includes('title="Faixa de Nível: Aplicado (Nível 5)"'));
  });

  it('should apply tier-specific styles and micro-interaction classes', () => {
    const html = renderToString(
      React.createElement(TierBadge, {
        level: 15,
        tier: 'Mestre',
      })
    );

    assert.ok(html.includes('Mestre'));
    assert.ok(html.includes('Nv 15'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('hover:scale-105'));
    assert.ok(html.includes('active:scale-95'));
  });

  it('should fallback gracefully for unknown tiers', () => {
    const html = renderToString(
      React.createElement(TierBadge, {
        level: 1,
        tier: 'Novato',
      })
    );

    assert.ok(html.includes('Novato'));
    assert.ok(html.includes('Nv 1'));
    assert.ok(html.includes('bg-slate-100'));
  });
});
