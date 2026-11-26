import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ConstellationControls } from './ConstellationControls';

describe('ConstellationControls Component (Phase 4 — Batch 2)', () => {
  it('deve renderizar botões de controle com acessibilidade e cursor-pointer', () => {
    const html = renderToString(
      React.createElement(ConstellationControls, {
        onZoomIn: () => {},
        onZoomOut: () => {},
        onFitGraph: () => {},
        showUrgentOnly: false,
        onToggleUrgentOnly: () => {},
        isAccessibleView: false,
        onToggleAccessibleView: () => {},
      }),
    );

    assert.ok(html.includes('aria-label="Controles de navegação e visualização do mapa"'));
    assert.ok(html.includes('aria-label="Aumentar zoom do mapa"'));
    assert.ok(html.includes('aria-label="Diminuir zoom do mapa"'));
    assert.ok(html.includes('aria-label="Enquadrar e centralizar constelação na tela"'));
    assert.ok(html.includes('cursor-pointer'));
    assert.ok(html.includes('Lista Acessível'));
  });

  it('deve refletir o estado de urgência ativado no botão correspondente', () => {
    const html = renderToString(
      React.createElement(ConstellationControls, {
        onZoomIn: () => {},
        onZoomOut: () => {},
        onFitGraph: () => {},
        showUrgentOnly: true,
        onToggleUrgentOnly: () => {},
        isAccessibleView: false,
        onToggleAccessibleView: () => {},
      }),
    );

    assert.ok(html.includes('aria-pressed="true"'));
    assert.ok(html.includes('bg-amber-500'));
  });

  it('deve exibir botão para retornar ao grafo quando a visualização acessível estiver ativa', () => {
    const html = renderToString(
      React.createElement(ConstellationControls, {
        onZoomIn: () => {},
        onZoomOut: () => {},
        onFitGraph: () => {},
        showUrgentOnly: false,
        onToggleUrgentOnly: () => {},
        isAccessibleView: true,
        onToggleAccessibleView: () => {},
      }),
    );

    assert.ok(html.includes('Ver Grafo'));
  });
});
