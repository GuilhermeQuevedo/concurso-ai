import { env } from '../config/env.js';
import type { IEntitlementRepository } from '../repositories/entitlement.repository.js';
import { isVipEmail } from '../utils/security.js';

interface UserLookup {
  findUserById(id: string): Promise<{ email: string; role: string } | null>;
}

export interface AccessStatus {
  active: boolean;
  enforced: boolean;
  status: string;
  expiresAt: Date | null;
}

export class PaymentService {
  constructor(
    private readonly users: UserLookup,
    private readonly entitlements: IEntitlementRepository,
  ) {}

  async getAccessForUser(userId: string): Promise<AccessStatus> {
    const user = await this.users.findUserById(userId);

    if (user?.role === 'ADMIN' || (user?.email && isVipEmail(user.email))) {
      return { active: true, enforced: env.REQUIRE_SUBSCRIPTION, status: 'ADMIN', expiresAt: null };
    }

    return this.getAccess(user?.email ?? '');
  }

  async getAccess(email: string): Promise<AccessStatus> {
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

    const entitlement = await this.entitlements.findByEmail(normalized);
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
