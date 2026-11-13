import { prisma } from '../database/prisma.js';
import { AnonymizationService } from './anonymization.service.js';

export interface RetentionOptions {
  dryRun?: boolean;
  batchSize?: number;
  inactiveUserMonthsNoPayment?: number; // padrão: 24 meses (2 anos)
  inactiveUserYearsWithPayment?: number; // padrão: 5 anos fiscais
  expiredTokenDays?: number; // padrão: 30 dias após expiração
  staleContactMonths?: number; // padrão: 12 meses (contatos descadastrados ou sem interação)
  auditLogRetentionYears?: number; // padrão: 5 anos
}

export interface RetentionReport {
  dryRun: boolean;
  executedAt: string;
  expiredSessionsPurged: number;
  expiredPasswordTokensPurged: number;
  inactiveUsersNoPaymentPurged: number;
  inactiveUsersWithPaymentAnonymized: number;
  staleContactsPurged: number;
  oldAuditLogsPurged: number;
}

export class RetentionService {
  constructor(private readonly anonymizationService = new AnonymizationService()) {}

  /**
   * Executa a rotina de expurgo e retenção conforme a política de ciclo de vida da LGPD.
   * Suporta modo dry-run para auditoria de contagens sem modificação de dados em repouso.
   */
  async runRetentionPurge(options: RetentionOptions = {}): Promise<RetentionReport> {
    const dryRun = options.dryRun ?? false;
    const batchSize = Math.max(1, Math.min(100, options.batchSize ?? 50));
    const now = new Date();

    const report: RetentionReport = {
      dryRun,
      executedAt: now.toISOString(),
      expiredSessionsPurged: 0,
      expiredPasswordTokensPurged: 0,
      inactiveUsersNoPaymentPurged: 0,
      inactiveUsersWithPaymentAnonymized: 0,
      staleContactsPurged: 0,
      oldAuditLogsPurged: 0,
    };

    console.log(`[RetentionJob] Iniciando rotina de expurgo | dryRun=${dryRun} | batchSize=${batchSize}`);

    // 1. Higienização de Sessões Expiradas (> N dias após expiresAt)
    const tokenDays = options.expiredTokenDays ?? 30;
    const tokenCutoff = new Date(now.getTime() - tokenDays * 24 * 60 * 60 * 1000);

    const expiredSessionsCount = await prisma.session.count({
      where: { expiresAt: { lt: tokenCutoff } },
    });

    if (!dryRun && expiredSessionsCount > 0) {
      const deleted = await prisma.session.deleteMany({
        where: { expiresAt: { lt: tokenCutoff } },
      });
      report.expiredSessionsPurged = deleted.count;
    } else {
      report.expiredSessionsPurged = expiredSessionsCount;
    }

    // 2. Higienização de Tokens de Recuperação de Senha Expirados
    const expiredTokensCount = await prisma.passwordResetToken.count({
      where: { expiresAt: { lt: tokenCutoff } },
    });

    if (!dryRun && expiredTokensCount > 0) {
      const deleted = await prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: tokenCutoff } },
      });
      report.expiredPasswordTokensPurged = deleted.count;
    } else {
      report.expiredPasswordTokensPurged = expiredTokensCount;
    }

    // 3. Contatos Descadastrados/Inativos (> N meses)
    const contactMonths = options.staleContactMonths ?? 12;
    const contactCutoff = new Date(now.getTime() - contactMonths * 30 * 24 * 60 * 60 * 1000);

    const staleContactsCount = await prisma.contact.count({
      where: {
        unsubscribed: true,
        createdAt: { lt: contactCutoff },
      },
    });

    if (!dryRun && staleContactsCount > 0) {
      const deleted = await prisma.contact.deleteMany({
        where: {
          unsubscribed: true,
          createdAt: { lt: contactCutoff },
        },
      });
      report.staleContactsPurged = deleted.count;
    } else {
      report.staleContactsPurged = staleContactsCount;
    }

    // 4. Trilha de Auditoria Administrativa Antiga (> N anos)
    const auditYears = options.auditLogRetentionYears ?? 5;
    const auditCutoff = new Date(now.getTime() - auditYears * 365 * 24 * 60 * 60 * 1000);

    const oldAuditCount = await prisma.adminAuditLog.count({
      where: { createdAt: { lt: auditCutoff } },
    });

    if (!dryRun && oldAuditCount > 0) {
      const deleted = await prisma.adminAuditLog.deleteMany({
        where: { createdAt: { lt: auditCutoff } },
      });
      report.oldAuditLogsPurged = deleted.count;
    } else {
      report.oldAuditLogsPurged = oldAuditCount;
    }

    // 5. Contas Inativas (separadas entre Com Pagamento e Sem Pagamento)
    const inactiveMonthsNoPayment = options.inactiveUserMonthsNoPayment ?? 24;
    const inactiveYearsWithPayment = options.inactiveUserYearsWithPayment ?? 5;

    const noPaymentCutoff = new Date(now.getTime() - inactiveMonthsNoPayment * 30 * 24 * 60 * 60 * 1000);
    const withPaymentCutoff = new Date(now.getTime() - inactiveYearsWithPayment * 365 * 24 * 60 * 60 * 1000);

    // Busca usuários candidatos à inatividade (apenas role USER e não eliminados previamente)
    const candidates = await prisma.user.findMany({
      where: {
        role: 'USER',
        erasureStatus: null,
        updatedAt: { lt: noPaymentCutoff },
        sessions: {
          none: {
            createdAt: { gte: noPaymentCutoff },
          },
        },
      },
      select: {
        id: true,
        email: true,
        updatedAt: true,
      },
      take: batchSize * 2, // Limite por execução
    });

    for (const candidate of candidates) {
      const paymentCount = await prisma.payment.count({
        where: { email: candidate.email },
      });

      if (paymentCount === 0) {
        // Usuário SEM histórico fiscal -> Hard delete elegível
        report.inactiveUsersNoPaymentPurged++;
        if (!dryRun) {
          try {
            await this.anonymizationService.deleteUserCascade(candidate.id, candidate.email);
            console.log(`[RetentionJob] Conta inativa sem pagamentos excluída: userId=${candidate.id}`);
          } catch (err) {
            console.error(`[RetentionJob] Erro ao excluir conta inativa ${candidate.id}:`, err);
          }
        }
      } else if (candidate.updatedAt < withPaymentCutoff) {
        // Usuário COM histórico fiscal expirado (> 5 anos) -> Anonimização irreversível
        report.inactiveUsersWithPaymentAnonymized++;
        if (!dryRun) {
          try {
            await this.anonymizationService.anonymizeUserFiscal(candidate.id, candidate.email);
            console.log(`[RetentionJob] Conta inativa fiscal anonimizada: userId=${candidate.id}`);
          } catch (err) {
            console.error(`[RetentionJob] Erro ao anonimizar conta fiscal inativa ${candidate.id}:`, err);
          }
        }
      }
    }

    console.log(
      `[RetentionJob] Concluído | dryRun=${dryRun} | Sessões=${report.expiredSessionsPurged} | Tokens=${report.expiredPasswordTokensPurged} | ContasSemPgto=${report.inactiveUsersNoPaymentPurged} | ContasComPgto=${report.inactiveUsersWithPaymentAnonymized} | Contatos=${report.staleContactsPurged} | Auditoria=${report.oldAuditLogsPurged}`,
    );

    return report;
  }
}
