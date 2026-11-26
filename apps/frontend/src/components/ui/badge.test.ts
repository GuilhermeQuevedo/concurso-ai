import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Badge } from './badge';

describe('Badge Component (Phase 2)', () => {
  it('should render default badge with fast duration transition', () => {
    const html = renderToString(React.createElement(Badge, null, 'Status'));

    assert.ok(html.includes('duration-fast'));
    assert.ok(html.includes('ease-standard'));
    assert.ok(html.includes('bg-primary-50'));
    assert.ok(html.includes('Status'));
  });

  it('should render success variant correctly', () => {
    const html = renderToString(
      React.createElement(Badge, { variant: 'success' }, 'Concluído'),
    );

    assert.ok(html.includes('bg-emerald-50'));
    assert.ok(html.includes('text-emerald-700'));
    assert.ok(html.includes('Concluído'));
  });

  it('should render decorative indicator dot when dot is true', () => {
    const html = renderToString(
      React.createElement(Badge, { dot: true }, 'Ao vivo'),
    );

    assert.ok(html.includes('rounded-full bg-current opacity-80'));
    assert.ok(html.includes('aria-hidden="true"'));
    assert.ok(html.includes('Ao vivo'));
  });

  it('should apply interactive active state when interactive is true', () => {
    const html = renderToString(
      React.createElement(Badge, { interactive: true }, 'Filtro'),
    );

    assert.ok(html.includes('cursor-pointer'));
    assert.ok(html.includes('active:scale-95'));
  });
});
