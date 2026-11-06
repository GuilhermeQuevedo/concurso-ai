import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

/**
 * Garante limites rígidos no pool de conexões do Prisma
 * para preservar os recursos do MariaDB na VPS (1 vCPU, 4GB RAM).
 * Padrão: connection_limit=12, pool_timeout=15s.
 */
function getEnforcedDatabaseUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '12');
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '15');
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getEnforcedDatabaseUrl(env.DATABASE_URL),
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
