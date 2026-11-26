import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AccountMenu } from './AccountMenu';

describe('AccountMenu Component (Phase 4 — Batch 1)', () => {
  const dummyIcon = () => React.createElement('svg');
  const dummyItems = [
    { path: '/profile', label: 'Meu Perfil', icon: dummyIcon },
    { path: '/settings', label: 'Configurações', icon: dummyIcon },
  ];

  it('should render closed trigger button with accessibility attributes', () => {
    const html = renderToString(
      React.createElement(AccountMenu, {
        items: dummyItems,
        onNavigate: () => {},
        onOpenBilling: () => {},
      }),
    );

    assert.ok(html.includes('aria-haspopup="menu"'));
    assert.ok(html.includes('aria-expanded="false"'));
    assert.ok(html.includes('Conta &amp; Ajustes') || html.includes('Conta & Ajustes'));
    assert.ok(html.includes('duration-fast'));
    assert.ok(html.includes('ease-standard'));
  });
});
