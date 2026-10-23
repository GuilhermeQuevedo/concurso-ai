import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';
import { getUserId } from '../utils/request.js';
import { isVipEmail } from '../utils/security.js';

export async function requireSubscription(req: Request, res: Response, next: NextFunction) {
  if (!env.REQUIRE_SUBSCRIPTION) {
    return next();
  }

  try {
    const userId = getUserId(req);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Usuário não autenticado.', code: 'UNAUTHORIZED' },
      });
    }

    // Administradores e contas VIP têm bypass incondicional
    if (user.role === 'ADMIN' || isVipEmail(user.email)) {
      return next();
    }

    const entitlement = await prisma.entitlement.findUnique({
      where: { email: user.email.toLowerCase() },
    });

    const active =
      !!entitlement &&
      entitlement.status === 'ACTIVE' &&
      (!entitlement.expiresAt || entitlement.expiresAt > new Date());

    if (active) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: { message: 'Assinatura necessária para acessar este recurso.', code: 'SUBSCRIPTION_REQUIRED' },
    });
  } catch (error) {
    next(error);
  }
}
