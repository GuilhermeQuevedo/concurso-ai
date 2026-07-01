import type { User, Session } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import type { IAuthRepository } from '../interfaces/auth.interfaces.js';

export class AuthRepository implements IAuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: { name: string; email: string; phone: string; password: string }): Promise<User> {
    return prisma.user.create({ data });
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
}
