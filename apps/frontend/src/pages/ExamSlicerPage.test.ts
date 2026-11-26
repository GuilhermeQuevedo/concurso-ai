import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { ExamSlicerPage } from './ExamSlicerPage';

describe('ExamSlicerPage Component (Phase 5 — Batch 3)', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  it('should render header, dropzones, and instructions', () => {
    const html = renderToString(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(ExamSlicerPage)
        )
      )
    );

    assert.ok(html.includes('Provas Comentadas (Exam Slicer)'));
    assert.ok(html.includes('Arquivo da Prova (PDF)'));
    assert.ok(html.includes('Gabarito Oficial (Opcional)'));
    assert.ok(html.includes('PDF com as questões da prova anterior'));
  });
});
