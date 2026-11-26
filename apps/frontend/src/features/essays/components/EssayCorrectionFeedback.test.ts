import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { EssayCorrectionFeedback } from './EssayCorrectionFeedback';
import type { EssayCriteria } from '../services/essay.service';

describe('EssayCorrectionFeedback Component (Phase 6 — Batch 2)', () => {
  const mockCriteria: EssayCriteria = {
    cac: {
      score: 35,
      maxScore: 40,
      comments: 'Excelente aprofundamento do tema com citação correta da jurisprudência do STF.',
    },
    ot: {
      score: 25,
      maxScore: 30,
      comments: 'Boa conexão entre os parágrafos argumentativos.',
    },
    dlp: {
      score: 28,
      maxScore: 30,
      comments: 'Domínio padrão da norma culta, sem desvios significativos.',
    },
  };

  it('should render score hero card with tier label, badge and final score', () => {
    const html = renderToString(
      React.createElement(EssayCorrectionFeedback, {
        score: 88,
        maxScore: 100,
        criteria: mockCriteria,
        feedback: 'Texto muito bem estruturado e com repertório sólido.',
      })
    );

    assert.ok(html.includes('Nota Final Homologada'));
    assert.ok(html.includes('88'));
    assert.ok(html.includes('100'));
    assert.ok(html.includes('Nível Aprovado'));
    assert.ok(html.includes('Excelente desempenho!'));
  });

  it('should render criteria breakdown with progress bars and score fractions', () => {
    const html = renderToString(
      React.createElement(EssayCorrectionFeedback, {
        score: 88,
        maxScore: 100,
        criteria: mockCriteria,
      })
    );

    assert.ok(html.includes('Critérios Avaliativos da Banca'));
    assert.ok(html.includes('CAC — Conteúdo e Atendimento ao Comando'));
    assert.ok(html.includes('OT — Organização Textual &amp; Coesão') || html.includes('OT — Organização Textual & Coesão'));
    assert.ok(html.includes('DLP — Domínio da Língua Portuguesa'));
    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('35') && html.includes('40'));
  });

  it('should render feedback comments with copy button and accessible touch target', () => {
    const html = renderToString(
      React.createElement(EssayCorrectionFeedback, {
        score: 65,
        maxScore: 100,
        feedback: 'Atenção especial ao uso de crase e vírgulas entre sujeito e predicado.',
      })
    );

    assert.ok(html.includes('Parecer Didático da Banca'));
    assert.ok(html.includes('Atenção especial ao uso de crase'));
    assert.ok(html.includes('Copiar Parecer'));
    assert.ok(html.includes('touch-manipulation'));
  });
});
