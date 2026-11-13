import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IncidentService } from './incident.service.js';
import { env } from '../config/env.js';

describe('Plano de Resposta a Incidentes e Canal do DPO (Gaps G06, G09)', () => {
  const incidentService = new IncidentService();

  describe('Canal do DPO e Transparência Regulamentar (Art. 41 LGPD)', () => {
    it('deve possuir e-mail oficial do DPO configurado', () => {
      assert.ok(env.DPO_EMAIL);
      assert.strictEqual(env.DPO_EMAIL, 'dpo@engrama.com.br');
    });

    it('deve possuir nome e comitê do DPO configurado', () => {
      assert.ok(env.DPO_NAME);
      assert.strictEqual(env.DPO_NAME, 'Comitê de Privacidade e Proteção de Dados');
    });
  });

  describe('generateIncidentId (Sequenciador Anual de Incidentes)', () => {
    it('deve gerar INC-YYYY-001 quando o log não tiver incidentes prévios', () => {
      const year = new Date().getFullYear();
      const emptyLog = '# Histórico de Incidentes\nNenhum incidente registrado.';
      const id = incidentService.generateIncidentId(emptyLog);
      assert.strictEqual(id, `INC-${year}-001`);
    });

    it('deve incrementar sequencialmente com base nos registros existentes', () => {
      const year = new Date().getFullYear();
      const existingLog = `
### INC-${year}-001 — Primeiro Incidente
### INC-${year}-002 — Segundo Incidente
      `;
      const id = incidentService.generateIncidentId(existingLog);
      assert.strictEqual(id, `INC-${year}-003`);
    });
  });
});
