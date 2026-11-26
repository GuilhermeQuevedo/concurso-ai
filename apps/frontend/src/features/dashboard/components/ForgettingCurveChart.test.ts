import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ForgettingCurveChart } from './ForgettingCurveChart';

describe('ForgettingCurveChart Component (Phase 6 — Batch 3)', () => {
  const mockPoints = [
    { day: 0, retention: 100 },
    { day: 1, retention: 80 },
    { day: 2, retention: 65 },
    { day: 7, retention: 90 },
    { day: 15, retention: 70 },
  ];
  const mockReviewDays = [1, 7, 15];

  it('should render accessible SVG elements with appropriate roles and labels', () => {
    const html = renderToString(
      React.createElement(ForgettingCurveChart, {
        points: mockPoints,
        reviewDays: mockReviewDays,
        horizon: 30,
      })
    );

    assert.ok(html.includes('role="img"'));
    assert.ok(html.includes('aria-label="Gráfico da curva do esquecimento de Ebbinghaus mostrando retenção percentual ao longo do tempo"'));
    assert.ok(html.includes('<title>Curva do Esquecimento e Revisão Espaçada</title>'));
    assert.ok(html.includes('viewBox="0 0 700 300"'));
  });

  it('should render Verde-Revisão stroke and fill tokens', () => {
    const html = renderToString(
      React.createElement(ForgettingCurveChart, {
        points: mockPoints,
        reviewDays: mockReviewDays,
        horizon: 30,
      })
    );

    // Color token #2E8C82 (Verde-Revisão)
    assert.ok(html.includes('stroke="#2E8C82"'));
    assert.ok(html.includes('fill="#2E8C82"'));
    assert.ok(html.includes('stop-color="#2E8C82"'));
  });

  it('should render percentage labels on the Y axis', () => {
    const html = renderToString(
      React.createElement(ForgettingCurveChart, {
        points: mockPoints,
        reviewDays: mockReviewDays,
        horizon: 30,
      })
    );

    assert.ok(html.includes('100%'));
    assert.ok(html.includes('50%'));
    assert.ok(html.includes('0%'));
  });
});
