import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ResultPanel } from './ResultPanel';
import type { GameResult } from '../services/game.service';

describe('ResultPanel Component (Phase 8 — Batch 4)', () => {
  const mockResult: GameResult = {
    score: 100,
    passed: true,
    correct: 5,
    total: 5,
    points: 120,
    earnedToday: 240,
    dailyCap: 400,
    capReached: false,
  };

  it('should render game round completion, score and action buttons', () => {
    const html = renderToString(
      React.createElement(ResultPanel, {
        result: mockResult,
        onAgain: () => {},
        onExit: () => {},
      })
    );

    assert.ok(html.includes('Excelente! Rodada concluída'));
    assert.ok(html.includes('5 de 5 acertos'));
    assert.ok(html.includes('+120 XP'));
    assert.ok(html.includes('Jogar de novo'));
    assert.ok(html.includes('Voltar aos jogos'));
  });

  it('should enforce Fitts Law touch targets on action buttons', () => {
    const html = renderToString(
      React.createElement(ResultPanel, {
        result: mockResult,
        onAgain: () => {},
        onExit: () => {},
      })
    );

    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });
});
