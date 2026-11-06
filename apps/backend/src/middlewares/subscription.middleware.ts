import type { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';
import { getUserId } from '../utils/request.js';
import { isVipEmail } from '../utils/security.js';

interface CachedSubscription {
  authorized: boolean;
  unauthorizedReason?: 'UNAUTHORIZED' | 'SUBSCRIPTION_REQUIRED';
}

const SUBSCRIPTION_CACHE_TTL_MS = 120 * 1000; // 2 minutos

const subscriptionCache = new LRUCache<string, CachedSubscription>({
  max: 10000,
  ttl: SUBSCRIPTION_CACHE_TTL_MS,
});

// Mapa de promises ativas para proteção contra Cache Stampede (Single-Flight)
const inFlightRequests = new Map<string, Promise<CachedSubscription>>();

/**
 * Invalida o cache de assinatura para um usuário ou e-mail específico,
 * ou limpa todo o cache caso nenhum identificador seja passado.
 */
export function invalidateSubscriptionCache(identifier?: string): void {
  if (!identifier) {
    subscriptionCache.clear();
    return;
  }
  const cleanId = identifier.trim().toLowerCase();
  subscriptionCache.delete(cleanId);
  for (const [key] of subscriptionCache.entries()) {
    if (key.toLowerCase() === cleanId) {
      subscriptionCache.delete(key);
    }
  }
}

async function fetchSubscriptionStatus(userId: string): Promise<CachedSubscription> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });

  if (!user) {
    return { authorized: false, unauthorizedReason: 'UNAUTHORIZED' };
  }

  // Administradores e contas VIP têm bypass incondicional
  if (user.role === 'ADMIN' || isVipEmail(user.email)) {
    return { authorized: true };
  }

  const entitlement = await prisma.entitlement.findUnique({
    where: { email: user.email.toLowerCase() },
  });

  const active =
    !!entitlement &&
    entitlement.status === 'ACTIVE' &&
    (!entitlement.expiresAt || entitlement.expiresAt > new Date());

  if (active) {
    return { authorized: true };
  }

  return { authorized: false, unauthorizedReason: 'SUBSCRIPTION_REQUIRED' };
}

export async function requireSubscription(req: Request, res: Response, next: NextFunction) {
  if (!env.REQUIRE_SUBSCRIPTION) {
    return next();
  }

  try {
    const userId = getUserId(req);

    // 1. Verificação direta em cache em memória (zero roundtrip ao banco)
    let cached = subscriptionCache.get(userId);

    if (!cached) {
      // 2. Proteção contra Cache Stampede com Single-Flight
      let inFlight = inFlightRequests.get(userId);
      if (!inFlight) {
        inFlight = fetchSubscriptionStatus(userId).finally(() => {
          inFlightRequests.delete(userId);
        });
        inFlightRequests.set(userId, inFlight);
      }
      cached = await inFlight;
      subscriptionCache.set(userId, cached);
    }

    if (!cached.authorized) {
      if (cached.unauthorizedReason === 'UNAUTHORIZED') {
        return res.status(401).json({
          success: false,
          error: { message: 'Usuário não autenticado.', code: 'UNAUTHORIZED' },
        });
      }

      return res.status(403).json({
        success: false,
        error: { message: 'Assinatura necessária para acessar este recurso.', code: 'SUBSCRIPTION_REQUIRED' },
      });
    }

    return next();
  } catch (error) {
    next(error);
  }
}
