import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MapActionToolbar } from './MapActionToolbar';

describe('MapActionToolbar Component (FASE 8 — Modos de Valor)', () => {
  it('deve renderizar botões de Pontos Fracos e Exportar com cursor-pointer', () => {
    const html = renderToString(
      React.createElement(MapActionToolbar, {
        weakPointsCount: 3,
        onOpenWeakPoints: () => {},
        onOpenExport: () => {},
      }),
    );

    assert.ok(html.includes('Pontos Fracos'));
    assert.ok(html.includes('3'));
    assert.ok(html.includes('Exportar'));
    assert.ok(html.includes('cursor-pointer'));
    assert.ok(html.includes('aria-label="Revisar 3 pontos fracos do edital"'));
    assert.ok(html.includes('aria-label="Exportar imagem, resumo ou link do mapa"'));
  });

  it('não deve exibir badge se weakPointsCount for 0', () => {
    const html = renderToString(
      React.createElement(MapActionToolbar, {
        weakPointsCount: 0,
        onOpenWeakPoints: () => {},
        onOpenExport: () => {},
      }),
    );

    assert.ok(html.includes('Pontos Fracos'));
    assert.ok(!html.includes('bg-rose-600 px-1'));
  });
});
