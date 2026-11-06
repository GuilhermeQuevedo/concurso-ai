import type { Entitlement } from '@prisma/client';

import { prisma } from '../database/prisma.js';

export interface IEntitlementRepository {
  findByEmail(email: string): Promise<Entitlement | null>;
}

export class EntitlementRepository implements IEntitlementRepository {
  findByEmail(email: string): Promise<Entitlement | null> {
    return prisma.entitlement.findUnique({ where: { email } });
  }
}
