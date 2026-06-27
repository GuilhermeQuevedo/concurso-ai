import type { User, Session } from '@prisma/client';

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: { name: string; email: string; password: string }): Promise<User>;
  createSession(data: { userId: string; refreshToken: string; expiresAt: Date }): Promise<Session>;
  findSessionByToken(refreshToken: string): Promise<Session | null>;
  deleteSession(id: string): Promise<void>;
  deleteAllUserSessions(userId: string): Promise<void>;
}

export interface TokenPayload {
  userId: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
