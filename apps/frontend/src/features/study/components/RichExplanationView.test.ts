import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { RichExplanationView } from './RichExplanationView';

describe('RichExplanationView Component (Phase 5 — Batch 2)', () => {
  const sampleExplanation = `
💡 Gabarito e Síntese:
A alternativa correta é a B. O mandado de segurança coletivo protege direitos líquidos e certos.

📖 Fundamentação & Fontes Normativas:
Art. 5º, LXX, da CF/88 e Lei 12.016/2009.

🔍 Análise dos Distratores:
- A: Incorreta, não cabe dilação probatória.
- C: Incorreta, não exige autorização especial.

⚠️ Dica do Especialista & Pegadinha da Banca:
Cuidado com a distinção entre direitos difusos e coletivos strictu sensu.
`;

  it('should parse structured sections and render appropriate titles and icons', () => {
    const html = renderToString(
      React.createElement(RichExplanationView, {
        explanation: sampleExplanation,
        correctAnswer: 'B',
      })
    );

    assert.ok(html.includes('Explicação &amp; Fundamentação Completa') || html.includes('Explicação & Fundamentação Completa'));
    assert.ok(html.includes('Gabarito:'));
    assert.ok(html.includes('Gabarito e Síntese'));
    assert.ok(html.includes('Fundamentação &amp; Fontes Normativas') || html.includes('Fundamentação & Fontes Normativas'));
    assert.ok(html.includes('Análise dos Distratores'));
    assert.ok(html.includes('Dica do Especialista'));
  });

  it('should render copy button with accessible touch target and touch-manipulation', () => {
    const html = renderToString(
      React.createElement(RichExplanationView, {
        explanation: 'Explicação simples sem blocos especiais.',
        correctAnswer: 'A',
      })
    );

    assert.ok(html.includes('Copiar'));
    assert.ok(html.includes('min-h-[44px]'));
    assert.ok(html.includes('touch-manipulation'));
  });

  it('should render general fallback block when raw explanation lacks headers', () => {
    const html = renderToString(
      React.createElement(RichExplanationView, {
        explanation: 'Esta questão aborda a responsabilidade civil objetiva do Estado prevista no artigo 37, parágrafo 6º.',
      })
    );

    assert.ok(html.includes('Fundamentação e Justificativa'));
    assert.ok(html.includes('responsabilidade civil objetiva'));
  });
});
