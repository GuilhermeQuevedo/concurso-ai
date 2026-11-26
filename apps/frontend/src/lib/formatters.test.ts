import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanWhitespace,
  normalizeEmail,
  normalizeDigits,
  formatCpf,
  formatPhone,
  normalizeDateToIso,
  cleanPastedText,
} from './formatters';

describe('Formatters & Postel Law Sanitizers (Phase 3)', () => {
  describe('cleanWhitespace', () => {
    it('should strip zero-width spaces, non-breaking spaces and collapse duplicate spaces', () => {
      const dirty = '\u200B  Nome   Completo\u00A0\uFEFF  ';
      assert.equal(cleanWhitespace(dirty), 'Nome Completo');
    });

    it('should handle empty input safely', () => {
      assert.equal(cleanWhitespace(''), '');
    });
  });

  describe('normalizeEmail', () => {
    it('should lowercase and strip accidental spaces and zero-width artifacts', () => {
      const email = '  Usuario.Teste\u200B@Engrama.COM.BR ';
      assert.equal(normalizeEmail(email), 'usuario.teste@engrama.com.br');
    });
  });

  describe('normalizeDigits', () => {
    it('should extract numbers only from messy text', () => {
      assert.equal(normalizeDigits('CPF: 123.456.789-01 (ativo)'), '12345678901');
      assert.equal(normalizeDigits(''), '');
    });
  });

  describe('formatCpf', () => {
    it('should format 11 digits into standard Brazilian CPF format', () => {
      assert.equal(formatCpf('12345678901'), '123.456.789-01');
    });

    it('should format partial digits progressively', () => {
      assert.equal(formatCpf('123'), '123');
      assert.equal(formatCpf('123456'), '123.456');
      assert.equal(formatCpf('123456789'), '123.456.789');
    });
  });

  describe('formatPhone', () => {
    it('should format 11-digit mobile phone with 9th digit', () => {
      assert.equal(formatPhone('11987654321'), '(11) 98765-4321');
    });

    it('should format 10-digit landline phone', () => {
      assert.equal(formatPhone('1133334444'), '(11) 3333-4444');
    });
  });

  describe('normalizeDateToIso', () => {
    it('should convert Brazilian date format DD/MM/YYYY to ISO YYYY-MM-DD', () => {
      assert.equal(normalizeDateToIso('25/12/2026'), '2026-12-25');
      assert.equal(normalizeDateToIso('05-01-2027'), '2027-01-05');
    });

    it('should normalize ISO date format with single digits to standard two-digit ISO', () => {
      assert.equal(normalizeDateToIso('2026-1-5'), '2026-01-05');
      assert.equal(normalizeDateToIso('2026/12/25'), '2026-12-25');
    });

    it('should return null for invalid date formats', () => {
      assert.equal(normalizeDateToIso('data-invalida'), null);
      assert.equal(normalizeDateToIso(''), null);
    });
  });

  describe('cleanPastedText', () => {
    it('should normalize line breaks, remove trailing spaces and limit consecutive empty lines', () => {
      const raw = 'Linha 1   \r\n\r\n\r\n\r\nLinha 2  \r\n\u200B\r\nLinha 3';
      const cleaned = cleanPastedText(raw);
      assert.ok(!cleaned.includes('\r'));
      assert.ok(!cleaned.includes('\n\n\n'));
      assert.ok(cleaned.includes('Linha 1\n\nLinha 2'));
    });
  });
});
