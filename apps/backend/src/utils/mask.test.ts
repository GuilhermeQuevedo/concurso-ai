import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maskEmail, maskPhone, maskName, hashIp } from './mask.js';

describe('mask.ts (Sanitização e Mascaramento de PII)', () => {
  describe('maskEmail', () => {
    it('deve mascarar e-mails comuns preservando primeiro e último caractere do username', () => {
      assert.strictEqual(maskEmail('narduccigabriel2@gmail.com'), 'n***2@gmail.com');
      assert.strictEqual(maskEmail('contato@engrama.tech'), 'c***o@engrama.tech');
    });

    it('deve lidar com usernames curtos', () => {
      assert.strictEqual(maskEmail('ab@domain.com'), 'a*@domain.com');
      assert.strictEqual(maskEmail('a@domain.com'), 'a*@domain.com');
    });

    it('deve tratar strings sem @ ou inválidas defensivamente', () => {
      assert.strictEqual(maskEmail('invalid-email'), '***@***.***');
      assert.strictEqual(maskEmail(''), '***@***.***');
    });
  });

  describe('maskPhone', () => {
    it('deve mascarar telefone preservando DDD e últimos dois dígitos', () => {
      assert.strictEqual(maskPhone('11987654321'), '119******21');
      assert.strictEqual(maskPhone('(11) 98765-4321'), '119******21');
    });

    it('deve retornar null para valores ausentes ou vazios', () => {
      assert.strictEqual(maskPhone(null), null);
      assert.strictEqual(maskPhone(undefined), null);
      assert.strictEqual(maskPhone(''), null);
    });

    it('deve mascarar números curtos de forma defensiva', () => {
      assert.strictEqual(maskPhone('1234'), '****');
    });
  });

  describe('maskName', () => {
    it('deve mascarar nome completo preservando iniciais', () => {
      assert.strictEqual(maskName('Gabriel Narducci'), 'G****** N*******');
      assert.strictEqual(maskName('Ana Silva'), 'A** S****');
    });

    it('deve retornar *** para valores nulos ou vazios', () => {
      assert.strictEqual(maskName(null), '***');
      assert.strictEqual(maskName(''), '***');
    });
  });

  describe('hashIp', () => {
    it('deve gerar hash determinístico e consistente para o mesmo IP', () => {
      const hash1 = hashIp('192.168.1.100');
      const hash2 = hashIp('192.168.1.100');
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(hash1.length, 64); // SHA-256 hex
    });

    it('deve gerar hashes diferentes para IPs distintos', () => {
      const hash1 = hashIp('192.168.1.100');
      const hash2 = hashIp('10.0.0.1');
      assert.notStrictEqual(hash1, hash2);
    });

    it('deve retornar unknown_hash para IP vazio', () => {
      assert.strictEqual(hashIp(''), 'unknown_hash');
    });
  });
});
