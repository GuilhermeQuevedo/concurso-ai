import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PresetChoiceCard } from './PresetChoiceCard';

describe('PresetChoiceCard Component', () => {
  it('renders card with title, subtitle and touch target', () => {
    const html = renderToString(
      React.createElement(PresetChoiceCard, {
        icon: React.createElement('span', null, 'Icon'),
        title: 'Educação',
        subtitle: '1 edital pronto',
        onClick: () => {},
      })
    );

    assert.ok(html.includes('Educação'));
    assert.ok(html.includes('1 edital pronto'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('#2E8C82'));
  });
});
