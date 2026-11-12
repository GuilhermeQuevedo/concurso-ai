import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactPii, redactObject } from './logger.js';

describe('logger.ts (PII Redaction e Sanitização)', () => {
  describe('redactPii', () => {
    it('deve ocultar tokens em headers de autorização Bearer', () => {
      const log = 'Request received: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
      const sanitized = redactPii(log);
      assert.strictEqual(sanitized, 'Request received: Authorization: Bearer [REDACTED]');
      assert.strictEqual(sanitized.includes('eyJhbGciOi'), false);
    });

    it('deve mascarar e-mails inseridos em mensagens de texto', () => {
      const log = 'Erro ao processar conta do aluno dev@engrama.tech no sistema';
      const sanitized = redactPii(log);
      assert.strictEqual(sanitized, 'Erro ao processar conta do aluno d***v@engrama.tech no sistema');
      assert.strictEqual(sanitized.includes('dev@engrama.tech'), false);
    });

    it('deve ocultar credenciais Basic Auth', () => {
      const log = 'Header: Basic dXNlcjpwYXNzd29yZA==';
      const sanitized = redactPii(log);
      assert.strictEqual(sanitized, 'Header: Basic [REDACTED]');
    });
  });

  describe('redactObject', () => {
    it('deve redigir chaves sensíveis (password, token, secrets)', () => {
      const payload = {
        email: 'aluno@concurso.com',
        password: 'SuperSecretPassword123!',
        refreshToken: 'rt_999888777',
        googleAccessToken: 'ya29.abcdef12345',
        safeMetadata: 'public_info',
      };

      const redacted = redactObject(payload);
      assert.strictEqual(redacted.password, '[REDACTED]');
      assert.strictEqual(redacted.refreshToken, '[REDACTED]');
      assert.strictEqual(redacted.googleAccessToken, '[REDACTED]');
      assert.strictEqual(redacted.email, 'a***o@concurso.com');
      assert.strictEqual(redacted.safeMetadata, 'public_info');
    });

    it('deve percorrer estruturas aninhadas e arrays recursivamente', () => {
      const nested = {
        user: {
          profile: {
            email: 'admin@engrama.tech',
            passwordHash: '$2b$12$abcdef...',
          },
          tokens: ['Bearer secret_token_123'],
        },
      };

      const redacted = redactObject(nested);
      assert.strictEqual(redacted.user.profile.passwordHash, '[REDACTED]');
      assert.strictEqual(redacted.user.profile.email, 'a***n@engrama.tech');
      assert.strictEqual(redacted.user.tokens[0], 'Bearer [REDACTED]');
    });
  });
});
