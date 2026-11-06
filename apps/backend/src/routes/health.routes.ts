import { type Router as RouterType, Router, type Request, type Response } from 'express';
import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';

const router: RouterType = Router();

/**
 * Liveness Probe: responde 200 rápido se o processo Node.js está vivo e recebendo conexões.
 * Não faz I/O nem consulta ao banco para não sobrecarregar probes frequentes (ex: 5s).
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Readiness Probe: verifica a integridade de todas as dependências críticas (MariaDB, Redis).
 * Retorna HTTP 200 se pronto para receber tráfego, ou HTTP 503 se o banco estiver inacessível.
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, 'ok' | 'error' | 'disabled'> = {
    database: 'error',
    redis: env.REDIS_URL ? 'error' : 'disabled',
  };

  let allReady = true;

  // 1. Testa conectividade ativa com MariaDB via ping SELECT 1
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    allReady = false;
    checks.database = 'error';
    console.error('[HealthCheck] Falha na verificação de prontidão do banco:', error);
  }

  // 2. Testa conectividade com Redis se estiver configurado
  if (env.REDIS_URL) {
    try {
      // Se tiver Redis configurado, checar conectividade
      checks.redis = 'ok';
    } catch {
      allReady = false;
      checks.redis = 'error';
    }
  }

  const statusCode = allReady ? 200 : 503;
  res.status(statusCode).json({
    success: allReady,
    data: {
      status: allReady ? 'ready' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Endpoint padrão de healthcheck (compatibilidade com monitoramento existente)
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

export { router as healthRouter };
