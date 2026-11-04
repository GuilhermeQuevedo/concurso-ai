import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';
import { isVipEmail } from '../utils/security.js';

export class PaymentService {
  async getAccess(email: string) {
    const normalized = email.toLowerCase().trim();

    // Contas VIP e administradores têm acesso vitalício ativo garantido
    if (isVipEmail(normalized)) {
      return {
        active: true,
        enforced: env.REQUIRE_SUBSCRIPTION,
        status: 'ACTIVE',
        expiresAt: new Date('2099-12-31T23:59:59.999Z'),
      };
    }

    const entitlement = await prisma.entitlement.findUnique({ where: { email: normalized } });
    const now = new Date();
    const active =
      !!entitlement &&
      entitlement.status === 'ACTIVE' &&
      (!entitlement.expiresAt || entitlement.expiresAt > now);

    return {
      active,
      enforced: env.REQUIRE_SUBSCRIPTION,
      status: entitlement?.status ?? 'NONE',
      expiresAt: entitlement?.expiresAt ?? null,
    };
  }
}
