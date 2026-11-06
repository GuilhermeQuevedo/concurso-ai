import type { Request, Response, NextFunction } from 'express';
import rateLimit, { type Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import { env } from '../config/env.js';

let redisClient: Redis | null = null;
let redisAvailable = false;

if (env.REDIS_URL) {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: false,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 1000);
      },
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      console.log('[RateLimit] Connected to Redis cache');
    });

    redisClient.on('error', (err) => {
      redisAvailable = false;
      console.warn('[RateLimit] Redis connection error, using MemoryStore fallback:', err.message);
    });
  } catch (err) {
    redisAvailable = false;
    console.warn('[RateLimit] Failed to initialize Redis client, falling back to MemoryStore:', err);
  }
}

function createRateLimitStore(prefix: string) {
  if (redisClient && redisAvailable) {
    try {
      return new RedisStore({
        // @ts-expect-error - ioredis sendCommand vs rate-limit-redis type mismatch
        sendCommand: (...args: string[]) => redisClient.call(...args),
        prefix: `rl:${prefix}:`,
      });
    } catch (err) {
      console.warn(`[RateLimit] Failed to create RedisStore for ${prefix}:`, err);
    }
  }
  return undefined;
}

function standard429Handler(
  _req: Request,
  res: Response,
  _next: NextFunction,
  options: Options,
): void {
  const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
  res.setHeader('Retry-After', retryAfterSeconds.toString());
  res.status(429).json({
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Muitas requisições. Por favor, aguarde alguns segundos antes de tentar novamente.',
      retryAfter: retryAfterSeconds,
    },
  });
}

/**
 * Rate Limiter para rotas críticas de autenticação (login, cadastro, recuperação de senha).
 * Chave composta por IP + e-mail informado no body, protegendo contra força bruta direcionada.
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === 'development' ? 60 : env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('auth'),
  handler: standard429Handler,
  keyGenerator: (req: Request) => {
    const email = typeof req.body === 'object' && req.body && 'email' in req.body
      ? String(req.body.email).trim().toLowerCase()
      : '';
    return `${req.ip || 'unknown'}_${email}`;
  },
});

/**
 * Rate Limiter para rotas autenticadas da API.
 * Chaveada pelo ID do usuário autenticado (ou IP como fallback seguro).
 */
export const authenticatedRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === 'development' ? 2000 : env.RATE_LIMIT_API_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('api'),
  handler: standard429Handler,
  keyGenerator: (req: Request) => {
    if (req.userId) {
      return `user_${req.userId}`;
    }
    return req.ip || 'unknown';
  },
});

/**
 * Rate Limiter para rotas públicas gerais da API (não logadas).
 * Chaveada por IP do cliente.
 */
export const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === 'development' ? 600 : env.RATE_LIMIT_PUBLIC_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('public'),
  handler: standard429Handler,
  keyGenerator: (req: Request) => req.ip || 'unknown',
});

/**
 * Rate Limiter para rotas pesadas (geração de questões, análise de editais, IA).
 * Chaveada pelo ID do usuário.
 */
export const heavyRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === 'development' ? 30 : env.RATE_LIMIT_HEAVY_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('heavy'),
  handler: standard429Handler,
  keyGenerator: (req: Request) => {
    if (req.userId) {
      return `heavy_${req.userId}`;
    }
    return `heavy_${req.ip || 'unknown'}`;
  },
});
