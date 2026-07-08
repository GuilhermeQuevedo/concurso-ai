import type { Request } from 'express';
import { AppError } from '../middlewares/error-handler.js';

export function getUserId(req: Request): string {
  if (!req.userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Usuário não autenticado');
  }
  return req.userId;
}
