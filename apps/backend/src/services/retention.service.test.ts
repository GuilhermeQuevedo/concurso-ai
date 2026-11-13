import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../database/prisma.js';
import { RetentionService } from './retention.service.js';

describe('RetentionService (Política de Retenção e Expurgo LGPD)', () => {
  const retentionService = new RetentionService();
  const testRunId = Date.now();
  const createdUserIds: string[] = [];
  const createdEmails: string[] = [];

  after(async () => {
    if (createdUserIds.length > 0) {
      await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    if (createdEmails.length > 0) {
      await prisma.payment.deleteMany({ where: { email: { in: createdEmails } } });
    }
  });

  it('deve simular expurgo em modo dry-run sem alterar o banco de dados', async () => {
    // 1. Criar usuário e sessão já expirada
    const email = `test_dryrun_${testRunId}@teste.com`;
    createdEmails.push(email);

    const user = await prisma.user.create({
      data: {
        name: 'Usuário DryRun',
        email,
        password: 'Password123!',
        role: 'USER',
      },
    });
    createdUserIds.push(user.id);

    // Cria sessão com expiração há 40 dias atrás
    const past40Days = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: `dryrun_token_${testRunId}`,
        expiresAt: past40Days,
      },
    });

    // 2. Executa em modo dry-run com threshold de 30 dias
    const report = await retentionService.runRetentionPurge({
      dryRun: true,
      expiredTokenDays: 30,
    });

    assert.strictEqual(report.dryRun, true);
    assert.ok(report.expiredSessionsPurged >= 1);

    // 3. Verifica que a sessão NÃO foi excluída do banco
    const sessionAfter = await prisma.session.findUnique({
      where: { id: session.id },
    });
    assert.ok(sessionAfter, 'A sessão não deve ser removida quando dryRun=true');
  });

  it('deve excluir fisicamente sessões expiradas quando dryRun=false', async () => {
    const email = `test_exec_${testRunId}@teste.com`;
    createdEmails.push(email);

    const user = await prisma.user.create({
      data: {
        name: 'Usuário Purge Real',
        email,
        password: 'Password123!',
        role: 'USER',
      },
    });
    createdUserIds.push(user.id);

    const past50Days = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000);
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: `real_token_${testRunId}`,
        expiresAt: past50Days,
      },
    });

    // Executa purge ativo
    const report = await retentionService.runRetentionPurge({
      dryRun: false,
      expiredTokenDays: 30,
    });

    assert.strictEqual(report.dryRun, false);
    assert.ok(report.expiredSessionsPurged >= 1);

    // Verifica que a sessão FOI excluída
    const sessionAfter = await prisma.session.findUnique({
      where: { id: session.id },
    });
    assert.strictEqual(sessionAfter, null, 'A sessão expirada deve ser removida');
  });

  it('deve expurgar contas inativas sem pagamento e anonimizar contas com pagamento', async () => {
    // 1. Cria conta inativa SEM pagamento (> 24 meses)
    const emailNoPay = `test_inactive_nopay_${testRunId}@teste.com`;
    const userNoPay = await prisma.user.create({
      data: {
        name: 'Inativo Sem Pagamento',
        email: emailNoPay,
        password: 'Password123!',
        role: 'USER',
        updatedAt: new Date(Date.now() - 25 * 30 * 24 * 60 * 60 * 1000), // 25 meses atrás
      },
    });

    // 2. Cria conta inativa COM pagamento (> 5 anos)
    const emailWithPay = `test_inactive_withpay_${testRunId}@teste.com`;
    createdEmails.push(emailWithPay);
    const userWithPay = await prisma.user.create({
      data: {
        name: 'Inativo Com Pagamento',
        email: emailWithPay,
        password: 'Password123!',
        role: 'USER',
        updatedAt: new Date(Date.now() - 6 * 365 * 24 * 60 * 60 * 1000), // 6 anos atrás
      },
    });
    createdUserIds.push(userWithPay.id);

    // Registra pagamento fiscal
    await prisma.payment.create({
      data: {
        email: emailWithPay,
        event: 'order_approved',
        status: 'PAID',
        amountCents: 2990,
      },
    });

    // Executa expurgo
    const report = await retentionService.runRetentionPurge({
      dryRun: false,
      inactiveUserMonthsNoPayment: 24,
      inactiveUserYearsWithPayment: 5,
    });

    assert.ok(report.inactiveUsersNoPaymentPurged >= 1);
    assert.ok(report.inactiveUsersWithPaymentAnonymized >= 1);

    // Verifica que o usuário sem pagamento foi hard deleted
    const userNoPayAfter = await prisma.user.findUnique({
      where: { id: userNoPay.id },
    });
    assert.strictEqual(userNoPayAfter, null);

    // Verifica que o usuário com pagamento foi anonimizado irreversivelmente
    const userWithPayAfter = await prisma.user.findUnique({
      where: { id: userWithPay.id },
    });
    assert.ok(userWithPayAfter);
    assert.strictEqual(userWithPayAfter.name, 'Usuário Anonimizado');
    assert.ok(userWithPayAfter.email.startsWith('deleted_'));
    assert.strictEqual(userWithPayAfter.erasureStatus, 'COMPLETED');
  });

  it('deve ser idempotente quando executado repetidas vezes', async () => {
    const report1 = await retentionService.runRetentionPurge({ dryRun: false });
    assert.ok(report1.executedAt);

    // Segunda execução imediata
    const report2 = await retentionService.runRetentionPurge({ dryRun: false });
    assert.strictEqual(report2.inactiveUsersNoPaymentPurged, 0);
    assert.strictEqual(report2.inactiveUsersWithPaymentAnonymized, 0);
  });
});
