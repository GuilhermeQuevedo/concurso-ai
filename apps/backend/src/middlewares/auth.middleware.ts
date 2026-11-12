import type { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from './error-handler.js';
import { prisma } from '../database/prisma.js';

interface CachedUserAuth {
  id: string;
  tokenVersion: number;
  erasureStatus: string | null;
  email: string;
}

const userAuthCache = new LRUCache<string, CachedUserAuth>({
  max: 2000,
  ttl: 15 * 1000, // 15 segundos de cache para otimizar polling sem retardar revogações
});

export function invalidateUserAuthCache(userId: string): void {
  userAuthCache.delete(userId);
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'MISSING_TOKEN', 'Token de autenticação não fornecido');
    }

    const token = header.slice(7);
    const payload = await verifyAccessToken(token);

    // Validação de integridade com cache em memória (otimiza polling de salas/ranking)
    let user = userAuthCache.get(payload.userId);
    if (!user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, tokenVersion: true, erasureStatus: true, email: true },
      });
      if (dbUser) {
        user = dbUser;
        userAuthCache.set(payload.userId, user);
      }
    }

    if (!user) {
      throw new AppError(401, 'INVALID_TOKEN', 'Usuário não encontrado ou conta removida');
    }

    if (user.erasureStatus || user.email.startsWith('deleted_')) {
      throw new AppError(401, 'ACCOUNT_ERASED', 'Conta excluída ou em processo de exclusão');
    }

    if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) {
      throw new AppError(401, 'TOKEN_REVOKED', 'Sessão encerrada ou token revogado');
    }

    req.userId = payload.userId;
    req.userRole = payload.role;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, 'INVALID_TOKEN', 'Token inválido ou expirado'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      next(new AppError(403, 'FORBIDDEN', 'Sem permissão para acessar este recurso'));
      return;
    }
    next();
  };
}
