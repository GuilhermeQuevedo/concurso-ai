import { prisma } from '../database/prisma.js';
import { invalidateSubscriptionCache } from '../middlewares/subscription.middleware.js';
import { AppError } from '../middlewares/error-handler.js';

const MANUAL_PROVIDER = 'manual';
const NO_EXPIRY = new Date('2099-12-31T23:59:59.999Z');
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AccessGrant {
  email: string;
  provider: string;
  expiresAt: Date | null;
}

export interface ManualAccessEntry extends AccessGrant {
  hasAccount: boolean;
}

// Liberação manual de acesso pelo painel admin. A chave é o e-mail, então vale
// até para quem ainda não criou conta (o acesso já está esperando no primeiro login).
export class AdminAccessService {
  async grant(email: string, days?: number): Promise<AccessGrant> {
    const expiresAt = days ? new Date(Date.now() + days * DAY_MS) : NO_EXPIRY;
    const entitlement = await prisma.entitlement.upsert({
      where: { email },
      create: { email, status: 'ACTIVE', provider: MANUAL_PROVIDER, expiresAt },
      update: { status: 'ACTIVE', provider: MANUAL_PROVIDER, expiresAt },
    });
    invalidateSubscriptionCache(email);
    return this.toGrant(entitlement);
  }

  async listManual(): Promise<ManualAccessEntry[]> {
    const now = new Date();
    const entitlements = await prisma.entitlement.findMany({
      where: { provider: MANUAL_PROVIDER, status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { updatedAt: 'desc' },
    });
    const users = await prisma.user.findMany({
      where: { email: { in: entitlements.map((e) => e.email) } },
      select: { email: true },
    });
    const registered = new Set(users.map((u) => u.email.toLowerCase()));
    return entitlements.map((e) => ({ ...this.toGrant(e), hasAccount: registered.has(e.email) }));
  }

  async revoke(email: string): Promise<void> {
    const existing = await prisma.entitlement.findUnique({ where: { email } });
    if (!existing) {
      throw new AppError(404, 'ACCESS_NOT_FOUND', 'Essa pessoa não tem acesso liberado.');
    }
    await prisma.entitlement.update({ where: { email }, data: { status: 'CANCELED' } });
    invalidateSubscriptionCache(email);
  }

  private toGrant(entitlement: { email: string; provider: string; expiresAt: Date | null }): AccessGrant {
    const permanent = entitlement.expiresAt?.getTime() === NO_EXPIRY.getTime();
    return {
      email: entitlement.email,
      provider: entitlement.provider,
      expiresAt: permanent ? null : entitlement.expiresAt,
    };
  }
}
