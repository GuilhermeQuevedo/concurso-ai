import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PomodoroTimer } from './PomodoroTimer';

describe('PomodoroTimer Component (Phase 7 — Batch 3)', () => {
  it('should render pomodoro modes, clock timer and start button', () => {
    const html = renderToString(React.createElement(PomodoroTimer));

    assert.ok(html.includes('Pomodoro &amp; Foco') || html.includes('Pomodoro & Foco'));
    assert.ok(html.includes('Foco'));
    assert.ok(html.includes('Pausa curta'));
    assert.ok(html.includes('Pausa longa'));
    assert.ok(html.includes('role="timer"'));
    assert.ok(html.includes('Iniciar Foco') || html.includes('Pausar Ciclo'));
  });

  it('should render progress bar with accessibility attributes', () => {
    const html = renderToString(React.createElement(PomodoroTimer));

    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('aria-label="Progresso do ciclo de foco atual"'));
  });

  it('should render touch targets compliant with Fitts Law and active scale', () => {
    const html = renderToString(React.createElement(PomodoroTimer));

    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('touch-manipulation'));
    assert.ok(html.includes('active:scale-[0.98]'));
    assert.ok(html.includes('Manter cronômetro flutuando em outras telas'));
  });
});
