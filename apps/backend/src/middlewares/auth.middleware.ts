import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from './error-handler.js';

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
