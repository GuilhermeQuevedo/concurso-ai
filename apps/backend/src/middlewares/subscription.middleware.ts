import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';
import { getUserId } from '../utils/request.js';

export async function requireSubscription(req: Request, res: Response, next: NextFunction) {
  if (!env.REQUIRE_SUBSCRIPTION) {
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: getUserId(req) },
      select: { email: true, role: true },
    });

    if (user?.role === 'ADMIN') {
      return next();
    }

    const entitlement = user
      ? await prisma.entitlement.findUnique({ where: { email: user.email.toLowerCase() } })
      : null;

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
