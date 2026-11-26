import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ConstanciaModal } from './ConstanciaModal';

describe('ConstanciaModal Component (Phase 6 — Batch 3)', () => {
  const mockCounts = new Map<string, number>([
    ['2026-11-20', 15],
    ['2026-11-21', 25],
    ['2026-11-22', 10],
  ]);
  const mockShielded = new Set<string>(['2026-11-19']);
  const mockToday = new Date(2026, 10, 24);
  const mockStreak = { current: 12, longest: 35, shields: 2 };

  it('should render modal dialog with accessible attributes and heading', () => {
    const html = renderToString(
      React.createElement(ConstanciaModal, {
        counts: mockCounts,
        shielded: mockShielded,
        today: mockToday,
        streak: mockStreak,
        onClose: () => {},
      })
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('aria-label="Constância"'));
    assert.ok(html.includes('Sua constância'));
  });

  it('should display streak count, record and shields with Astryx tokens', () => {
    const html = renderToString(
      React.createElement(ConstanciaModal, {
        counts: mockCounts,
        shielded: mockShielded,
        today: mockToday,
        streak: mockStreak,
        onClose: () => {},
      })
    );

    assert.ok(html.includes('12'));
    assert.ok(html.includes('recorde:'));
    assert.ok(html.includes('35'));
    assert.ok(html.includes('2'));
    assert.ok(html.includes('escudo'));
    // Color token #F2A93B for flame / streak
    assert.ok(html.includes('#F2A93B'));
  });

  it('should render close button meeting Fitts Law touch targets', () => {
    const html = renderToString(
      React.createElement(ConstanciaModal, {
        counts: mockCounts,
        shielded: mockShielded,
        today: mockToday,
        streak: mockStreak,
        onClose: () => {},
      })
    );

    assert.ok(html.includes('aria-label="Fechar"'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('min-w-[44px]'));
  });
});
