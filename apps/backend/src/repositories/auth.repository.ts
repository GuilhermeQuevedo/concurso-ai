import type { User, Session, PasswordResetToken } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import type { IAuthRepository } from '../interfaces/auth.interfaces.js';

export class AuthRepository implements IAuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleId } });
  }

  async createUser(data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    googleId?: string;
    avatar?: string;
    role?: 'ADMIN' | 'USER';
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  async updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      dailyGoal?: number;
      pausedUntil?: Date | null;
      googleId?: string;
      avatar?: string;
      emailVerified?: boolean;
      role?: 'ADMIN' | 'USER';
    },
  ): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async resetUserData(userId: string): Promise<void> {
    const where = { userId };
    await prisma.$transaction([
      prisma.questionAttempt.deleteMany({ where }),
      prisma.studySession.deleteMany({ where }),
      prisma.favorite.deleteMany({ where }),
      prisma.note.deleteMany({ where }),
      prisma.flashcard.deleteMany({ where }),
      prisma.achievement.deleteMany({ where }),
      prisma.groupActivity.deleteMany({ where }),
      prisma.topicReview.deleteMany({ where }),
      prisma.studyTask.deleteMany({ where }),
      prisma.studyPlan.deleteMany({ where }),
      prisma.essay.deleteMany({ where }),
      prisma.document.deleteMany({ where }),
      prisma.groupMember.deleteMany({ where }),
      prisma.streak.deleteMany({ where }),
      prisma.contest.deleteMany({ where }),
      prisma.rankingParticipant.deleteMany({ where }),
      prisma.questionSet.deleteMany({ where }),
      prisma.gameSession.deleteMany({ where }),
      prisma.gameRound.deleteMany({ where }),
      prisma.flashcardDeck.deleteMany({ where }),
    ]);
  }

  async createSession(data: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<Session> {
    return prisma.session.create({ data });
  }

  async findSessionByToken(refreshToken: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { refreshToken } });
  }

  async deleteSession(id: string): Promise<void> {
    await prisma.session.delete({ where: { id } });
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  }

  async createPasswordResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    // Invalida tokens anteriores não usados do usuário
    await prisma.passwordResetToken.deleteMany({
      where: { userId: data.userId },
    });

    return prisma.passwordResetToken.create({ data });
  }

  async findValidPasswordResetToken(tokenHash: string): Promise<(PasswordResetToken & { user: User }) | null> {
    return prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  async consumePasswordResetToken(tokenId: string, userId: string, newPasswordHash: string): Promise<void> {
    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { password: newPasswordHash },
      }),
      prisma.session.deleteMany({
        where: { userId },
      }),
    ]);
  }
}
