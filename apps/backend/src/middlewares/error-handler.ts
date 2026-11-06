import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ApiResponse } from '@concurso-ai/types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

interface PrismaErrorLike {
  code?: string;
  meta?: Record<string, unknown>;
  message?: string;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction,
): void {
  // 1. Erros operacionais da aplicação
  if (err instanceof AppError) {
    console.warn(`[AppError ${err.statusCode}] ${err.code}: ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
    return;
  }

  // 2. Erros de validação de schemas Zod
  if (err instanceof ZodError) {
    const validationMessage = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    console.warn(`[ZodError 400] ${validationMessage}`);
    res.status(400).json({
      success: false,
      error: {
        message: validationMessage,
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  // 3. Mapeamento resiliente de erros do motor Prisma
  const prismaErr = err as PrismaErrorLike;
  if (typeof prismaErr?.code === 'string') {
    switch (prismaErr.code) {
      case 'P2002': {
        // Conflito de constraint única
        const fields = Array.isArray(prismaErr.meta?.target)
          ? prismaErr.meta?.target.join(', ')
          : String(prismaErr.meta?.target ?? 'registro');
        console.warn(`[Prisma P2002 409] Unique constraint failed on: ${fields}`);
        res.status(409).json({
          success: false,
          error: {
            message: `Conflito de unicidade: o recurso (${fields}) já existe.`,
            code: 'RESOURCE_CONFLICT',
          },
        });
        return;
      }

      case 'P2024': {
        // Pool de conexões esgotado/timeout
        console.error('[Prisma P2024 503] Connection pool timeout');
        res.setHeader('Retry-After', '5');
        res.status(503).json({
          success: false,
          error: {
            message: 'O banco de dados está ocupado no momento. Tente novamente em instantes.',
            code: 'DATABASE_POOL_TIMEOUT',
          },
        });
        return;
      }

      case 'P2034': {
        // Conflito ou deadlock em transação
        console.warn('[Prisma P2034 409] Transaction write conflict');
        res.status(409).json({
          success: false,
          error: {
            message: 'Conflito de escrita concorrente detectado. Por favor, repita a operação.',
            code: 'TRANSACTION_CONFLICT',
          },
        });
        return;
      }

      case 'P2025': {
        // Registro dependente não encontrado
        console.warn('[Prisma P2025 404] Record not found');
        res.status(404).json({
          success: false,
          error: {
            message: 'Registro solicitado não foi encontrado.',
            code: 'RESOURCE_NOT_FOUND',
          },
        });
        return;
      }
    }
  }

  // 4. Erros não tratados (500)
  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
  });
}
