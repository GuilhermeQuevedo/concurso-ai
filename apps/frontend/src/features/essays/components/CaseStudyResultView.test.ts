import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CaseStudyResultView } from './CaseStudyResultView';
import type { CaseStudyResult } from '../services/essay.service';

describe('CaseStudyResultView Component (Phase 6 — Batch 2)', () => {
  const mockResult: CaseStudyResult = {
    score: 13,
    maxScore: 30,
    framing: 'Direito Administrativo — Pregão Eletrônico e Impugnação de Edital',
    aspects: [
      {
        aspect: 'Prazo decadencial para impugnação ao edital',
        situation: 'correto',
        points: 10,
        maxPoints: 10,
        justification: 'O candidato indicou corretamente o prazo legal de 3 dias úteis.',
      },
      {
        aspect: 'Competência da autoridade julgadora',
        situation: 'parcial',
        points: 5,
        maxPoints: 10,
        justification: 'Mencionou o pregoeiro mas omitiu a autoridade homologadora.',
      },
      {
        aspect: 'Efeitos do recurso administrativo',
        situation: 'incorreto',
        points: 0,
        maxPoints: 10,
        justification: 'Afirmou erroneamente a existência de efeito suspensivo automático.',
      },
    ],
    form: {
      strengths: 'Vocabulário técnico adequado e respeito à norma padrão.',
      issues: 'Frases excessivamente longas no segundo parágrafo.',
      deduction: 1.5,
    },
    penalties: [
      {
        reason: 'Erro de concordância verbal na linha 14',
        deduction: 0.5,
      },
    ],
    calculation: 'NF = (10 + 5 + 0) - 1.5 - 0.5 = 13.0',
    feedback: [
      'Reforce a leitura dos artigos relativos a prazos recursais na Nova Lei de Licitações.',
      'Evite períodos com mais de 3 linhas para manter a clareza argumentativa.',
    ],
  };

  it('should render framing and content aspects with situations and score points', () => {
    const html = renderToString(
      React.createElement(CaseStudyResultView, { result: mockResult })
    );

    assert.ok(html.includes('Enquadramento Temático'));
    assert.ok(html.includes('Direito Administrativo'));
    assert.ok(html.includes('Correção por Aspecto do Espelho'));
    assert.ok(html.includes('Prazo decadencial para impugnação'));
    assert.ok(html.includes('Correto'));
    assert.ok(html.includes('Parcial'));
    assert.ok(html.includes('Incorreto'));
  });

  it('should render aspect progress bars with accessibility attributes', () => {
    const html = renderToString(
      React.createElement(CaseStudyResultView, { result: mockResult })
    );

    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('aria-valuenow="100"'));
    assert.ok(html.includes('aria-valuenow="50"'));
    assert.ok(html.includes('aria-valuenow="0"'));
  });

  it('should render formal aspects, penalties, formula calculation and practical recommendations', () => {
    const html = renderToString(
      React.createElement(CaseStudyResultView, { result: mockResult })
    );

    assert.ok(html.includes('Aspectos Formais &amp; Linguagem') || html.includes('Aspectos Formais & Linguagem'));
    assert.ok(html.includes('Penalidades Aplicadas'));
    assert.ok(html.includes('Desconto de forma') && (html.includes('1,5') || html.includes('1.5')));
    assert.ok(html.includes('NF = (10 + 5 + 0)'));
    assert.ok(html.includes('Recomendações Práticas da Banca'));
    assert.ok(html.includes('Reforce a leitura dos artigos'));
  });
});
