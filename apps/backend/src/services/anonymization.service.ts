import crypto from 'node:crypto';
import { prisma } from '../database/prisma.js';
import type { Prisma } from '@prisma/client';

export class AnonymizationService {
  /**
   * Executa a rotina unificada de eliminação ou anonimização fiscal conforme o Art. 16, I da LGPD.
   * Se o titular possuir histórico de pagamentos, seus dados cadastrais são irreversivelmente
   * anonimizados e dados pessoais de estudo são eliminados, retendo apenas dados fiscais mínimos.
   * Se não possuir pagamentos, executa a exclusão definitiva com cascade.
   */
  async executeUserErasure(
    userId: string,
    userEmail: string,
    customAnonymizedEmail?: string,
  ): Promise<{ hadPayments: boolean; anonymizedEmail?: string }> {
    const userPaymentsCount = await prisma.payment.count({
      where: { email: userEmail },
    });
    const hadPayments = userPaymentsCount > 0;

    if (hadPayments) {
      const anonymizedEmail = await this.anonymizeUserFiscal(userId, userEmail, customAnonymizedEmail);
      return { hadPayments: true, anonymizedEmail };
    }

    await this.deleteUserCascade(userId, userEmail);
    return { hadPayments: false };
  }

  /**
   * Anonimização fiscal irreversível:
   * - Substitui nome por 'Usuário Anonimizado'
   * - Substitui e-mail por 'deleted_<uuid>@engrama.internal' (UUID aleatório, nunca hash)
   * - Remove telefone, avatar, senhas, tokens OAuth e preferências
   * - Apaga redações, tentativas de questões, flashcards, planos de estudo e sessões
   * - Atualiza histórico de pagamentos para o e-mail anonimizado (Art. 16, I LGPD e Art. 173 CTN)
   */
  async anonymizeUserFiscal(
    userId: string,
    originalEmail: string,
    customAnonymizedEmail?: string,
  ): Promise<string> {
    const anonymizedEmail = customAnonymizedEmail ?? `deleted_${crypto.randomUUID()}@engrama.internal`;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Atualiza registros de pagamentos para o e-mail anonimizado mantendo histórico fiscal
      await tx.payment.updateMany({
        where: { email: originalEmail },
        data: { email: anonymizedEmail },
      });

      // 2. Remove direitos de acesso
      await tx.entitlement.deleteMany({
        where: { email: originalEmail },
      });

      // 3. Remove dados pessoais de estudo, atividades e integrações
      await tx.session.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.questionAttempt.deleteMany({ where: { userId } });
      await tx.studySession.deleteMany({ where: { userId } });
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.note.deleteMany({ where: { userId } });
      await tx.flashcard.deleteMany({ where: { userId } });
      await tx.flashcardDeck.deleteMany({ where: { userId } });
      await tx.achievement.deleteMany({ where: { userId } });
      await tx.streak.deleteMany({ where: { userId } });
      await tx.groupMember.deleteMany({ where: { userId } });
      await tx.groupActivity.deleteMany({ where: { userId } });
      await tx.essay.deleteMany({ where: { userId } });
      await tx.contest.deleteMany({ where: { userId } });
      await tx.studyTask.deleteMany({ where: { userId } });
      await tx.topicReview.deleteMany({ where: { userId } });
      await tx.rankingParticipant.deleteMany({ where: { userId } });
      await tx.questionSet.deleteMany({ where: { userId } });
      await tx.gameSession.deleteMany({ where: { userId } });
      await tx.gameRound.deleteMany({ where: { userId } });
      await tx.document.deleteMany({ where: { userId } });
      await tx.editalMap.deleteMany({ where: { userId } });
      await tx.studySchedule.deleteMany({ where: { userId } });
      await tx.studyPlan.deleteMany({ where: { userId } });
      await tx.userCalendarIntegration.deleteMany({ where: { userId } });
      await tx.consentRecord.deleteMany({ where: { userId } });

      // 4. Anonimiza irreversivelmente os dados cadastrais do User
      await tx.user.update({
        where: { id: userId },
        data: {
          name: 'Usuário Anonimizado',
          email: anonymizedEmail,
          phone: null,
          avatar: null,
          password: null,
          googleId: null,
          stripeCustomerId: null,
          targetExam: null,
          targetRole: null,
          dailyGoal: 0,
          emailVerified: false,
          pausedUntil: null,
          tokenVersion: { increment: 1 },
          erasureStatus: 'COMPLETED',
          erasureCompletedAt: new Date(),
        },
      });
    });

    return anonymizedEmail;
  }

  /**
   * Exclusão definitiva para contas sem histórico fiscal
   */
  async deleteUserCascade(userId: string, originalEmail: string): Promise<void> {
    await prisma.entitlement.deleteMany({
      where: { email: originalEmail },
    });

    // Reatribui ou remove grupos de estudo onde o usuário é o criador
    const groupsCreated = await prisma.studyGroup.findMany({
      where: { createdById: userId },
      include: { members: true },
    });

    for (const g of groupsCreated) {
      if (g.members.length <= 1) {
        await prisma.studyGroup.delete({ where: { id: g.id } });
      } else {
        const another = g.members.find((m) => m.userId !== userId);
        if (another) {
          await prisma.studyGroup.update({
            where: { id: g.id },
            data: { createdById: another.userId },
          });
        }
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  }
}
