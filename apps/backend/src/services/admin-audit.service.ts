import { prisma } from '../database/prisma.js';
import type { AdminAuditAction, AuditResourceType, AdminAuditLog } from '@prisma/client';
import { AppError } from '../middlewares/error-handler.js';

export interface RecordAuditParams {
  adminId: string;
  action: AdminAuditAction;
  resourceType: AuditResourceType;
  resourceCount?: number;
  resourceIds?: string[];
  justification?: string;
  ip: string;
  userAgent?: string;
}

export interface ListAuditLogsQuery {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: AdminAuditAction;
  resourceType?: AuditResourceType;
}

export class AdminAuditService {
  /**
   * Registra uma operação administrativa de acesso ou modificação a dados pessoais.
   * Garante que nenhum dado pessoal em claro (nomes, e-mails, telefones) seja gravado no log.
   */
  async recordAudit(params: RecordAuditParams): Promise<AdminAuditLog> {
    if (!params.adminId) {
      throw new AppError(400, 'AUDIT_ERROR', 'adminId é obrigatório para registro de auditoria');
    }

    // Sanitização defensiva: valida se nenhum item em resourceIds se assemelha a e-mail
    if (params.resourceIds && params.resourceIds.some((id) => id.includes('@'))) {
      throw new AppError(500, 'AUDIT_SECURITY_VIOLATION', 'Proibido gravar e-mails ou PII em resourceIds de auditoria');
    }

    return prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        resourceType: params.resourceType,
        resourceCount: params.resourceCount ?? (params.resourceIds ? params.resourceIds.length : 1),
        resourceIds: params.resourceIds ? params.resourceIds : undefined,
        justification: params.justification?.trim() || null,
        ip: params.ip || 'unknown',
        userAgent: params.userAgent || null,
      },
    });
  }

  /**
   * Consulta paginada dos logs de auditoria administrativa (acesso restrito aos administradores mestres).
   */
  async listAuditLogs(query: ListAuditLogsQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const skip = (page - 1) * limit;

    const where = {
      ...(query.adminId ? { adminId: query.adminId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.resourceType ? { resourceType: query.resourceType } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          admin: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
