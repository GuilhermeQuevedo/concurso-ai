import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { TermsOfUsePage } from './TermsOfUsePage';
import { CookiePolicyPage } from './CookiePolicyPage';

describe('Legal & Compliance Pages (Phase 4 — Batch 3)', () => {
  describe('PrivacyPolicyPage', () => {
    it('renderiza política com conformidade LGPD, DPO e tokens Astryx', () => {
      const html = renderToString(
        React.createElement(MemoryRouter, null, React.createElement(PrivacyPolicyPage)),
      );

      assert.ok(html.includes('Política de Privacidade'));
      assert.ok(html.includes('Lei 13.709/2018 (LGPD)'));
      assert.ok(html.includes('dpo@engrama.com.br'));
      assert.ok(html.includes('Art. 18 da LGPD'));
      assert.ok(html.includes('astryx-theme'));
      assert.ok(html.includes('bg-[var(--color-canvas)]'));
      assert.ok(html.includes('border-[var(--color-border-subtle)]'));
    });
  });

  describe('TermsOfUsePage', () => {
    it('renderiza termos de uso com aviso legal e regras aceitáveis', () => {
      const html = renderToString(
        React.createElement(MemoryRouter, null, React.createElement(TermsOfUsePage)),
      );

      assert.ok(html.includes('Termos de Uso'));
      assert.ok(html.includes('AVISO LEGAL'));
      assert.ok(html.includes('Regras de Uso Aceitável'));
      assert.ok(html.includes('astryx-theme'));
      assert.ok(html.includes('bg-[var(--color-canvas)]'));
    });
  });

  describe('CookiePolicyPage', () => {
    it('renderiza política de cookies com tabela de identificadores e botão de preferências', () => {
      const html = renderToString(
        React.createElement(MemoryRouter, null, React.createElement(CookiePolicyPage)),
      );

      assert.ok(html.includes('Política de Cookies e Armazenamento Local'));
      assert.ok(html.includes('accessToken'));
      assert.ok(html.includes('refreshToken'));
      assert.ok(html.includes('Alterar minhas preferências'));
      assert.ok(html.includes('astryx-theme'));
    });
  });
});
