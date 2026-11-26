import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QuestionSourceChooser } from './QuestionSourceChooser';

describe('QuestionSourceChooser Component', () => {
  it('renders modal dialog with accessible headers and options', () => {
    const html = renderToString(
      React.createElement(QuestionSourceChooser, {
        onChoose: () => {},
        onClose: () => {},
      })
    );

    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('De onde vêm as questões?'));
    assert.ok(html.includes('Gerar com o motor IA das bancas'));
    assert.ok(html.includes('Questões diretamente das bancas'));
    assert.ok(html.includes('#2E8C82'));
  });
});
