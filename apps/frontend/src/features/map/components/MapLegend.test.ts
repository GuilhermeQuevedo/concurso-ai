import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MapLegend } from './MapLegend';

describe('MapLegend Component (Phase 4 — Batch 1)', () => {
  it('deve renderizar a legenda com área acessível e métricas de cobertura', () => {
    const html = renderToString(
      React.createElement(MapLegend, {
        totalTopics: 120,
        studiedTopics: 48,
        coveragePercentage: 40,
      }),
    );

    assert.ok(html.includes('role="region"') || html.includes('aria-label="Legenda e convenções do Mapa de Revisão"'));
    assert.ok(html.includes('Convenções do Mapa'));
    assert.ok(html.includes('48/120 (40%)'));
  });

  it('deve conter explicações não cromáticas de domínio, tracejado e anel âmbar', () => {
    const html = renderToString(
      React.createElement(MapLegend, {
        totalTopics: 50,
        studiedTopics: 10,
        coveragePercentage: 20,
      }),
    );

    assert.ok(html.includes('Domínio do Conteúdo'));
    assert.ok(html.includes('Borda tracejada: Tópico ainda não estudado'));
    assert.ok(html.includes('Anel âmbar: Flashcards vencidos hoje'));
    assert.ok(html.includes('Tamanho do nó: Incidência na banca'));
  });
});
