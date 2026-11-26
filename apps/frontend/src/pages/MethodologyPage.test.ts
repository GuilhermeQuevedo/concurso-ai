import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MethodologyPage } from './MethodologyPage';

describe('MethodologyPage Component (Phase 9 — Batch 1)', () => {
  it('should render page title, intro banner, and neuroscience sections', () => {
    const html = renderToString(React.createElement(MethodologyPage));

    assert.ok(html.includes('Metodologia'));
    assert.ok(html.includes('Como você fixa o conteúdo na memória'));
    assert.ok(html.includes('Técnicas de foco e estudo ativo'));
    assert.ok(html.includes('Como sustentamos sua constância diária'));
    assert.ok(html.includes('Repetição espaçada'));
    assert.ok(html.includes('Curva do esquecimento'));
    assert.ok(html.includes('Recordação ativa'));
    assert.ok(html.includes('Técnica Pomodoro'));
    assert.ok(html.includes('Técnica Feynman'));
  });

  it('should render scientific citations, Astryx card surfaces and application bullets', () => {
    const html = renderToString(React.createElement(MethodologyPage));

    assert.ok(html.includes('Na plataforma'));
    assert.ok(html.includes('Hermann Ebbinghaus'));
    assert.ok(html.includes('Richard Feynman'));
    assert.ok(html.includes('rounded-2xl'));
    assert.ok(html.includes('border-slate-200'));
  });
});
