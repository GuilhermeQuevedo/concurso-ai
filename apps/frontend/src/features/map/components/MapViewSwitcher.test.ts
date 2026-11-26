import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MapViewSwitcher } from './MapViewSwitcher';

describe('MapViewSwitcher Component (Phase 6 — Tree View & 3D Universe)', () => {
  it('deve renderizar abas acessíveis com role="tablist" e botões clicáveis', () => {
    const html = renderToString(
      React.createElement(MapViewSwitcher, {
        activeView: 'CONSTELLATION',
        onChangeView: () => {},
      }),
    );

    assert.ok(html.includes('role="tablist"'));
    assert.ok(html.includes('Constelação'));
    assert.ok(html.includes('Universo 3D'));
    assert.ok(html.includes('Árvore do Edital'));
    assert.ok(html.includes('aria-selected="true"'));
    assert.ok(html.includes('cursor-pointer'));
  });

  it('deve indicar visualmente a seleção da árvore do edital', () => {
    const html = renderToString(
      React.createElement(MapViewSwitcher, {
        activeView: 'TREE',
        onChangeView: () => {},
      }),
    );

    assert.ok(html.includes('aria-selected="true"'));
  });

  it('deve indicar visualmente a seleção do universo 3D', () => {
    const html = renderToString(
      React.createElement(MapViewSwitcher, {
        activeView: 'UNIVERSE_3D',
        onChangeView: () => {},
      }),
    );

    assert.ok(html.includes('aria-selected="true"'));
  });
});
