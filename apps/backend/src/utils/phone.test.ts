import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePhone } from './phone.js';
import { registerSchema } from '../validators/auth.validators.js';
import { AuthService } from '../services/auth.service.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { prisma } from '../database/prisma.js';

describe('Minimização do Campo Telefone (Gap G11)', () => {
  describe('sanitizePhone (Helper de Sanitização)', () => {
    it('deve remover caracteres cosméticos (espaços, parênteses, traços)', () => {
      assert.strictEqual(sanitizePhone('(11) 98765-4321'), '11987654321');
      assert.strictEqual(sanitizePhone('  (21) 91234-5678  '), '21912345678');
      assert.strictEqual(sanitizePhone('61-9999-8888'), '6199998888');
    });

    it('deve preservar o prefixo + em números internacionais', () => {
      assert.strictEqual(sanitizePhone('+55 (11) 98765-4321'), '+5511987654321');
      assert.strictEqual(sanitizePhone('+1 (555) 019-2834'), '+15550192834');
    });

    it('deve retornar null para strings vazias, apenas espaços ou sem dígitos', () => {
      assert.strictEqual(sanitizePhone(''), null);
      assert.strictEqual(sanitizePhone('   '), null);
      assert.strictEqual(sanitizePhone(null), null);
      assert.strictEqual(sanitizePhone(undefined), null);
      assert.strictEqual(sanitizePhone('abc-def'), null);
    });
  });

  describe('registerSchema (Validação Zod de Telefone Opcional)', () => {
    const basePayload = {
      name: 'Candidato Teste',
      email: 'candidato.teste@exemplo.com',
      password: 'StrongPassword123!',
    };

    it('deve permitir cadastro SEM telefone (omitido)', () => {
      const parsed = registerSchema.safeParse(basePayload);
      assert.strictEqual(parsed.success, true);
    });

    it('deve permitir cadastro com telefone nulo ou vazio', () => {
      const parsedNull = registerSchema.safeParse({ ...basePayload, phone: null });
      assert.strictEqual(parsedNull.success, true);

      const parsedEmpty = registerSchema.safeParse({ ...basePayload, phone: '' });
      assert.strictEqual(parsedEmpty.success, true);
    });

    it('deve aceitar e sanitizar telefone válido com máscara', () => {
      const parsed = registerSchema.safeParse({
        ...basePayload,
        phone: '(11) 98765-4321',
      });
      assert.strictEqual(parsed.success, true);
      if (parsed.success) {
        assert.strictEqual(parsed.data.phone, '11987654321');
      }
    });

    it('deve aceitar e sanitizar telefone internacional com prefixo +', () => {
      const parsed = registerSchema.safeParse({
        ...basePayload,
        phone: '+55 (11) 98765-4321',
      });
      assert.strictEqual(parsed.success, true);
      if (parsed.success) {
        assert.strictEqual(parsed.data.phone, '+5511987654321');
      }
    });

    it('deve rejeitar telefone inválido com número insuficiente de dígitos', () => {
      const parsed = registerSchema.safeParse({
        ...basePayload,
        phone: '12345',
      });
      assert.strictEqual(parsed.success, false);
      if (!parsed.success) {
        const phoneError = parsed.error.issues.find((i) => i.path.includes('phone'));
        assert.ok(phoneError);
        assert.strictEqual(phoneError.message, 'Telefone inválido');
      }
    });

    it('deve rejeitar telefone com caracteres alfabéticos', () => {
      const parsed = registerSchema.safeParse({
        ...basePayload,
        phone: 'telefone_invalido',
      });
      assert.strictEqual(parsed.success, false);
      if (!parsed.success) {
        const phoneError = parsed.error.issues.find((i) => i.path.includes('phone'));
        assert.ok(phoneError);
        assert.strictEqual(phoneError.message, 'Telefone inválido');
      }
    });
  });

  describe('AuthService.register (Persistência Sanitizada)', () => {
    const authRepository = new AuthRepository();
    const authService = new AuthService(authRepository);

    const createdEmails: string[] = [];

    after(async () => {
      if (createdEmails.length > 0) {
        await prisma.user.deleteMany({
          where: { email: { in: createdEmails } },
        });
      }
    });

    it('deve persistir cadastro com telefone sanitizado', async () => {
      const email = `test_phone_masked_${Date.now()}@example.com`;
      createdEmails.push(email);

      await authService.register({
        name: 'Usuário Com Telefone',
        email,
        phone: '(11) 98765-4321',
        password: 'StrongPassword123!',
        acceptTerms: true,
        acceptPrivacy: true,
        acceptAgeOrGuardian: true,
      });

      const user = await prisma.user.findUnique({ where: { email } });
      assert.ok(user);
      assert.strictEqual(user.phone, '11987654321');
    });

    it('deve persistir cadastro SEM telefone mantendo campo nulo', async () => {
      const email = `test_phone_none_${Date.now()}@example.com`;
      createdEmails.push(email);

      await authService.register({
        name: 'Usuário Sem Telefone',
        email,
        phone: undefined,
        password: 'StrongPassword123!',
        acceptTerms: true,
        acceptPrivacy: true,
        acceptAgeOrGuardian: true,
      });

      const user = await prisma.user.findUnique({ where: { email } });
      assert.ok(user);
      assert.strictEqual(user.phone, null);
    });
  });
});
