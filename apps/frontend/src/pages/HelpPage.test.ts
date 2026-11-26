import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { HelpPage } from './HelpPage';

describe('HelpPage Component (Phase 9 — Batch 1)', () => {
  it('should render page title, guided tour button, and search field', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(HelpPage)
      )
    );

    assert.ok(html.includes('Central de Ajuda'));
    assert.ok(html.includes('Fazer tour guiado'));
    assert.ok(html.includes('Buscar dúvidas'));
    assert.ok(html.includes('Primeiros passos'));
    assert.ok(html.includes('Disciplinas e Bancas'));
    assert.ok(html.includes('Estudo e Simulados'));
  });

  it('should enforce Fitts Law touch targets and mobile font floor on inputs', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(HelpPage)
      )
    );

    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('text-base sm:text-sm'));
    assert.ok(html.includes('bg-[#2E8C82]'));
  });
});
