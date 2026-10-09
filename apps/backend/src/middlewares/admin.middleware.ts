import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma.js';
import { getUserId } from '../utils/request.js';

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: getUserId(req) },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: { message: 'Acesso restrito ao administrador.', code: 'ADMIN_ONLY' },
    });
  } catch (error) {
    next(error);
  }
}
