import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AdminAuditService } from './admin-audit.service.js';
import { AppError } from '../middlewares/error-handler.js';

describe('AdminAuditService (Trilha de Auditoria Administrativa)', () => {
  const service = new AdminAuditService();

  it('deve rejeitar tentativa de registrar auditoria sem adminId', async () => {
    await assert.rejects(
      async () => {
        await service.recordAudit({
          adminId: '',
          action: 'USER_LIST_VIEW',
          resourceType: 'USER',
          ip: '127.0.0.1',
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual((err as AppError).code, 'AUDIT_ERROR');
        return true;
      },
    );
  });

  it('deve barrar tentativa de vazamento de e-mail no array resourceIds com AUDIT_SECURITY_VIOLATION', async () => {
    await assert.rejects(
      async () => {
        await service.recordAudit({
          adminId: 'admin_test_1',
          action: 'USER_PII_REVEAL',
          resourceType: 'USER',
          resourceIds: ['valid_cuid_1', 'leaked_email@domain.com'],
          ip: '127.0.0.1',
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual((err as AppError).code, 'AUDIT_SECURITY_VIOLATION');
        return true;
      },
    );
  });

  it('deve respeitar os limites de paginação (mínimo 1, máximo 100)', async () => {
    const result = await service.listAuditLogs({ page: -5, limit: 500 });
    assert.strictEqual(result.pagination.page, 1);
    assert.strictEqual(result.pagination.limit, 100);
    assert.ok(Array.isArray(result.logs));
  });
});
