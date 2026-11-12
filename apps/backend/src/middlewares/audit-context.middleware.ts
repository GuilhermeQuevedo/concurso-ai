import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware que enriquece a requisição com contexto de auditoria (adminId, IP, User-Agent).
 * Não grava logs diretamente: a responsabilidade de registrar a auditoria é da camada de Service.
 */
export function auditContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.ip || req.socket.remoteAddress || 'unknown';

  const userAgent = (req.headers['user-agent'] as string) || 'unknown';

  req.auditContext = {
    adminId: req.userId || 'unknown',
    ip,
    userAgent,
  };

  next();
}
