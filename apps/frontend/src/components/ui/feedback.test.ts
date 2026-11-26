import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';
import { Toaster } from './Toaster';
import { toast, dismissToast } from './toast-store';

describe('Feedback Components (Phase 3 - Lote 3)', () => {
  describe('Spinner', () => {
    it('renders with accessible role and label', () => {
      const html = renderToString(
        React.createElement(Spinner, { label: 'Sincronizando dados...' }),
      );

      assert.ok(html.includes('progressbar') || html.includes('astryx-spinner'));
      assert.ok(html.includes('Sincronizando dados...'));
    });

    it('supports different sizes without crashing', () => {
      const htmlSm = renderToString(React.createElement(Spinner, { size: 'sm' }));
      const htmlLg = renderToString(React.createElement(Spinner, { size: 'lg' }));

      assert.ok(htmlSm.length > 0);
      assert.ok(htmlLg.length > 0);
    });

    it('supports explicit aria-label for accessibility', () => {
      const html = renderToString(
        React.createElement(Spinner, { 'aria-label': 'Carregando questões' }),
      );

      assert.ok(html.includes('Carregando questões') || html.includes('progressbar'));
    });
  });

  describe('EmptyState', () => {
    it('renders title and description properly', () => {
      const html = renderToString(
        React.createElement(EmptyState, {
          title: 'Nenhum flashcard',
          description: 'Crie seu primeiro baralho para começar.',
        }),
      );

      assert.ok(html.includes('Nenhum flashcard'));
      assert.ok(html.includes('Crie seu primeiro baralho para começar.'));
    });

    it('renders compact mode with semantic heading', () => {
      const html = renderToString(
        React.createElement(EmptyState, {
          title: 'Sem avisos',
          isCompact: true,
          headingLevel: 4,
        }),
      );

      assert.ok(html.includes('Sem avisos'));
      assert.ok(html.includes('compact') || html.includes('<h4'));
    });
  });

  describe('Toaster', () => {
    it('returns null when no toasts are present', () => {
      const html = renderToString(React.createElement(Toaster));
      assert.equal(html, '');
    });

    it('renders toast notifications pushed to store', () => {
      toast.success('Flashcard memorizado com sucesso');
      const html = renderToString(React.createElement(Toaster));

      assert.ok(html.includes('Flashcard memorizado'));

      // Clean up toast for subsequent tests
      dismissToast(1);
    });
  });
});
