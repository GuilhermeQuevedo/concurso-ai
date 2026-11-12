import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { AuthService } from './auth.service.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { prisma } from '../database/prisma.js';
import { safeBcryptHash } from '../utils/crypto-semaphore.js';
import type { StripeClient } from '../providers/stripe.client.js';
import type { GoogleCalendarClient } from '../providers/google-calendar.client.js';

describe('DSAR - Direitos do Titular LGPD (Exportação e Eliminação de Conta)', () => {
  const authRepository = new AuthRepository();

  let stripeCancelCalledWith: string | null = null;
  let stripeAnonymizeCalledWith: { customerId: string; anonymizedEmail: string } | null = null;
  let googleRevokeCalledWith: string | null = null;

  const mockStripeClient = {
    cancelCustomerSubscriptions: async (customerId: string) => {
      stripeCancelCalledWith = customerId;
    },
    anonymizeCustomer: async (customerId: string, anonymizedEmail: string) => {
      stripeAnonymizeCalledWith = { customerId, anonymizedEmail };
    },
  } as unknown as StripeClient;

  const mockGoogleCalendarClient = {
    revokeToken: async (token: string) => {
      googleRevokeCalledWith = token;
    },
  } as unknown as GoogleCalendarClient;

  const authService = new AuthService(
    authRepository,
    undefined,
    undefined,
    mockStripeClient,
    mockGoogleCalendarClient,
  );

  const testUserPassword = 'StrongPassword123!';
  let userWithoutPaymentsId: string;
  let userWithoutPaymentsEmail: string;

  let userWithPaymentsId: string;
  let userWithPaymentsEmail: string;

  before(async () => {
    const passwordHash = await safeBcryptHash(testUserPassword, 4);

    // 1. Usuário de teste sem pagamentos
    userWithoutPaymentsEmail = `test_dsar_nopay_${Date.now()}@example.com`;
    const user1 = await prisma.user.create({
      data: {
        name: 'Usuário Sem Pagamento',
        email: userWithoutPaymentsEmail,
        password: passwordHash,
        phone: '11999990001',
        dailyGoal: 20,
      },
    });
    userWithoutPaymentsId = user1.id;

    // Adiciona dados pessoais relacionados
    await prisma.session.create({
      data: {
        userId: user1.id,
        refreshToken: `token_${Date.now()}_1`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    await prisma.essay.create({
      data: {
        userId: user1.id,
        title: 'Redação de Teste DSAR',
        theme: 'Proteção de Dados Pessoais',
        content: 'Conteúdo pessoal da redação...',
      },
    });

    // 2. Usuário de teste com pagamentos
    userWithPaymentsEmail = `test_dsar_withpay_${Date.now()}@example.com`;
    const user2 = await prisma.user.create({
      data: {
        name: 'Usuário Com Pagamento',
        email: userWithPaymentsEmail,
        password: passwordHash,
        phone: '11999990002',
        stripeCustomerId: 'cus_mock_stripe_123',
        dailyGoal: 40,
      },
    });
    userWithPaymentsId = user2.id;

    // Registra pagamento associado ao e-mail
    await prisma.payment.create({
      data: {
        email: userWithPaymentsEmail,
        event: 'order.approved',
        status: 'PAID',
        amountCents: 19990,
        currency: 'BRL',
        provider: 'stripe',
      },
    });

    // Registra integração de calendário mockada
    await prisma.userCalendarIntegration.create({
      data: {
        userId: user2.id,
        feedToken: `feed_tok_${Date.now()}`,
        googleRefreshToken: 'mock_google_refresh_token',
      },
    });
  });

  after(async () => {
    // Limpeza de contingência
    await prisma.payment.deleteMany({
      where: {
        email: { in: [userWithoutPaymentsEmail, userWithPaymentsEmail] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [userWithoutPaymentsId, userWithPaymentsId] },
      },
    }).catch(() => {});
  });

  describe('GET /me/export (Exportação de Dados Pessoais)', () => {
    it('deve exportar apenas os campos da allowlist estrita sem vazar dados sensíveis', async () => {
      const exported = await authService.exportUserData(userWithoutPaymentsId);

      // Metadados
      assert.ok(exported.exportMetadata);
      assert.ok(exported.exportMetadata.legalNotice.includes('LGPD'));

      // Perfil
      assert.ok(exported.profile);
      assert.strictEqual(exported.profile.id, userWithoutPaymentsId);
      assert.strictEqual(exported.profile.email, userWithoutPaymentsEmail);
      assert.strictEqual(exported.profile.name, 'Usuário Sem Pagamento');

      // Verificação negativa: ausência de senhas, hashes ou tokens
      const exportedJson = JSON.stringify(exported);
      assert.strictEqual(exportedJson.includes(testUserPassword), false, 'Senha em claro não pode estar presente');
      assert.strictEqual(exportedJson.includes('passwordHash'), false, 'Hash de senha não pode estar presente');
      assert.strictEqual(exportedJson.includes('refreshToken'), false, 'Refresh token não pode estar presente');
      assert.strictEqual(exportedJson.includes('googleRefreshToken'), false, 'Token de integração Google não pode estar presente');

      // Arrays permitidos
      assert.ok(Array.isArray(exported.studySessions));
      assert.ok(Array.isArray(exported.questionAttempts));
      assert.ok(Array.isArray(exported.notes));
      assert.ok(Array.isArray(exported.favorites));
      assert.ok(Array.isArray(exported.flashcards));
      assert.ok(Array.isArray(exported.essays));
      assert.ok(Array.isArray(exported.payments));
    });

    it('deve validar a senha se fornecida para exportação', async () => {
      await assert.rejects(
        async () => {
          await authService.exportUserData(userWithoutPaymentsId, 'SenhaErrada123');
        },
        (err: unknown) => {
          assert.strictEqual((err as { code: string }).code, 'INVALID_PASSWORD');
          return true;
        },
      );
    });
  });

  describe('POST /me/erasure (Eliminação e Anonimização de Dados)', () => {
    it('deve exigir senha ao tentar excluir conta com senha', async () => {
      await assert.rejects(
        async () => {
          await authService.eraseAccount(userWithoutPaymentsId, {});
        },
        (err: unknown) => {
          assert.strictEqual((err as { code: string }).code, 'PASSWORD_REQUIRED');
          return true;
        },
      );
    });

    it('deve rejeitar exclusão com senha incorreta', async () => {
      await assert.rejects(
        async () => {
          await authService.eraseAccount(userWithoutPaymentsId, { password: 'WrongPassword!' });
        },
        (err: unknown) => {
          assert.strictEqual((err as { code: string }).code, 'INVALID_PASSWORD');
          return true;
        },
      );
    });

    it('CENÁRIO 1: Usuário SEM pagamentos deve ter a conta excluída definitivamente com cascade', async () => {
      const result = await authService.eraseAccount(userWithoutPaymentsId, {
        password: testUserPassword,
        reason: 'Quero encerrar meus estudos',
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.message.includes('Art. 18 da LGPD'));

      // Verifica que o registro de User foi hard deleted
      const checkUser = await prisma.user.findUnique({
        where: { id: userWithoutPaymentsId },
      });
      assert.strictEqual(checkUser, null, 'Usuário sem pagamento deve ser removido do banco');

      // Verifica que o log de auditoria do descarte existe
      const userHash = crypto.createHash('sha256').update(userWithoutPaymentsId).digest('hex');
      const erasureLog = await prisma.erasureLog.findUnique({
        where: { userHash },
      });
      assert.ok(erasureLog);
      assert.strictEqual(erasureLog.hadPayments, false);
      assert.strictEqual(erasureLog.reason, 'Quero encerrar meus estudos');

      // IDEMPOTÊNCIA: segunda execução deve retornar sucesso sem erro
      const retryResult = await authService.eraseAccount(userWithoutPaymentsId, {
        password: testUserPassword,
      });
      assert.strictEqual(retryResult.success, true);
    });

    it('CENÁRIO 2: Usuário COM pagamentos deve sofrer anonimização irreversível e reter apenas dados fiscais', async () => {
      const result = await authService.eraseAccount(userWithPaymentsId, {
        password: testUserPassword,
        reason: 'Privacidade de dados',
      });

      assert.strictEqual(result.success, true);

      // Verifica que o User foi irreversivelmente anonimizado
      const anonymizedUser = await prisma.user.findUnique({
        where: { id: userWithPaymentsId },
      });
      assert.ok(anonymizedUser);
      assert.strictEqual(anonymizedUser.name, 'Usuário Anonimizado');
      assert.strictEqual(anonymizedUser.phone, null);
      assert.strictEqual(anonymizedUser.avatar, null);
      assert.strictEqual(anonymizedUser.password, null);
      assert.strictEqual(anonymizedUser.googleId, null);
      assert.strictEqual(anonymizedUser.stripeCustomerId, null);
      assert.strictEqual(anonymizedUser.erasureStatus, 'COMPLETED');
      assert.ok(anonymizedUser.email.startsWith('deleted_'));
      assert.ok(anonymizedUser.email.endsWith('@engrama.internal'));

      // Verifica que o Stripe e Google foram acionados
      assert.strictEqual(stripeCancelCalledWith, 'cus_mock_stripe_123');
      assert.ok(stripeAnonymizeCalledWith, 'Stripe customer deve ser anonimizado no operador');
      assert.strictEqual(stripeAnonymizeCalledWith.customerId, 'cus_mock_stripe_123');
      assert.strictEqual(stripeAnonymizeCalledWith.anonymizedEmail, anonymizedUser.email);
      assert.strictEqual(googleRevokeCalledWith, 'mock_google_refresh_token');

      // Verifica que o e-mail nos registros de Payment foi atualizado para o e-mail anônimo
      const originalPayments = await prisma.payment.findMany({
        where: { email: userWithPaymentsEmail },
      });
      assert.strictEqual(originalPayments.length, 0, 'Nenhum pagamento pode conter o e-mail original');

      const anonymizedPayments = await prisma.payment.findMany({
        where: { email: anonymizedUser.email },
      });
      assert.strictEqual(anonymizedPayments.length, 1, 'Registro fiscal deve ser preservado sob o e-mail anônimo');
      assert.strictEqual(anonymizedPayments[0].amountCents, 19990);
      assert.strictEqual(anonymizedPayments[0].currency, 'BRL');

      // Verifica log de disaster recovery
      const userHash = crypto.createHash('sha256').update(userWithPaymentsId).digest('hex');
      const log = await prisma.erasureLog.findUnique({
        where: { userHash },
      });
      assert.ok(log);
      assert.strictEqual(log.hadPayments, true);

      // IDEMPOTÊNCIA: chamada subsequente deve responder sucesso imediatamente
      const retryResult = await authService.eraseAccount(userWithPaymentsId, {});
      assert.strictEqual(retryResult.success, true);

      // Limpeza final do registro anônimo
      await prisma.payment.deleteMany({ where: { email: anonymizedUser.email } });
      await prisma.user.delete({ where: { id: userWithPaymentsId } });
    });
  });
});
