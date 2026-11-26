import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { PomodoroMini } from './PomodoroMini';
import { pomodoro } from './pomodoro-store';
import { setPomodoroFloating } from './floating-preference';

describe('PomodoroMini Draggable & Resizable Widget', () => {
  beforeEach(() => {
    setPomodoroFloating(true);
    pomodoro.start();
  });

  afterEach(() => {
    pomodoro.pause();
  });

  it('should render draggable and resizable timer in floating mode on non-dashboard routes', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/study'] },
        React.createElement(PomodoroMini)
      )
    );

    assert.ok(html.includes('role="timer"'));
    assert.ok(html.includes('Cronômetro flutuante maleável'));
    assert.ok(html.includes('Arraste para mover o cronômetro para qualquer lugar da tela'));
    assert.ok(html.includes('Arraste para redimensionar largura e altura'));
    assert.ok(html.includes('cursor-nwse-resize'));
    assert.ok(html.includes('cursor-grab'));
  });

  it('should render timer controls including play/pause, expand, and close buttons', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/games'] },
        React.createElement(PomodoroMini)
      )
    );

    assert.ok(html.includes('bg-[#2E8C82]'));
    assert.ok(html.includes('Pausar Pomodoro') || html.includes('Iniciar Pomodoro'));
    assert.ok(html.includes('Expandir tamanho do cronômetro') || html.includes('Minimizar'));
    assert.ok(html.includes('Ocultar cronômetro flutuante'));
  });

  it('should return null when rendered on the dashboard route', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/dashboard'] },
        React.createElement(PomodoroMini)
      )
    );

    assert.strictEqual(html, '');
  });
});
