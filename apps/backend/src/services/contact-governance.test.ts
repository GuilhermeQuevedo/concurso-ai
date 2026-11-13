import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../database/prisma.js';
import { AdminService } from './admin.service.js';
import { importContactsSchema, contactOptOutSchema } from '../validators/admin.validators.js';
import { hashEmail } from '../utils/mask.js';

describe('Governança na Importação de Contatos e Supressão (Gap G10)', () => {
  const adminService = new AdminService();
  const testRunId = Date.now();
  const testEmail1 = `lead_consent_${testRunId}@teste.com`;
  const testEmail2 = `lead_optout_${testRunId}@teste.com`;
  const testEmail3 = `lead_legitimate_${testRunId}@teste.com`;
  const adminTestEmail = `admin_tester_${testRunId}@teste.com`;

  const cleanupEmails = [testEmail1, testEmail2, testEmail3];
  const cleanupHashes: string[] = [];
  let testAdminId = '';

  before(async () => {
    // Criar um usuário administrador para os testes de auditoria
    const admin = await prisma.user.create({
      data: {
        name: 'Admin Tester',
        email: adminTestEmail,
        password: 'dummy_hash',
        role: 'ADMIN',
      },
    });
    testAdminId = admin.id;
  });

  after(async () => {
    // Limpeza de contatos criados nos testes
    await prisma.contact.deleteMany({
      where: {
        email: { in: cleanupEmails },
      },
    });

    // Limpeza de supressões criadas
    if (cleanupHashes.length > 0) {
      await prisma.contactSuppression.deleteMany({
        where: {
          emailHash: { in: cleanupHashes },
        },
      });
    }

    if (testAdminId) {
      await prisma.adminAuditLog.deleteMany({
        where: { adminId: testAdminId },
      });
      await prisma.user.delete({
        where: { id: testAdminId },
      });
    }
  });

  describe('Validação Zod de Importação (importContactsSchema)', () => {
    it('deve rejeitar importação sem base legal (legalBasis)', () => {
      const parsed = importContactsSchema.safeParse({
        text: 'Nome, lead@teste.com, 11987654321',
        consentProofNotes: 'Inscrição realizada na live de Direito Administrativo',
      });
      assert.strictEqual(parsed.success, false);
      if (!parsed.success) {
        const err = parsed.error.issues.find((i) => i.path.includes('legalBasis'));
        assert.ok(err);
      }
    });

    it('deve rejeitar importação com consentProofNotes inferior a 10 caracteres', () => {
      const parsed = importContactsSchema.safeParse({
        text: 'Nome, lead@teste.com, 11987654321',
        legalBasis: 'CONSENT',
        consentProofNotes: 'Curto',
      });
      assert.strictEqual(parsed.success, false);
      if (!parsed.success) {
        const err = parsed.error.issues.find((i) => i.path.includes('consentProofNotes'));
        assert.ok(err);
      }
    });

    it('deve rejeitar base LEGITIMATE_INTEREST sem relatório LIA (legitimateInterestAssessmentRef)', () => {
      const parsed = importContactsSchema.safeParse({
        text: 'Nome, lead@teste.com, 11987654321',
        legalBasis: 'LEGITIMATE_INTEREST',
        consentProofNotes: 'Prospects de eventos públicos de concursos',
      });
      assert.strictEqual(parsed.success, false);
      if (!parsed.success) {
        const err = parsed.error.issues.find((i) => i.path.includes('legitimateInterestAssessmentRef'));
        assert.ok(err);
        assert.ok(err.message.includes('LIA'));
      }
    });

    it('deve aceitar base LEGITIMATE_INTEREST com referência válida de LIA', () => {
      const parsed = importContactsSchema.safeParse({
        text: 'Nome, lead@teste.com, 11987654321',
        legalBasis: 'LEGITIMATE_INTEREST',
        consentProofNotes: 'Prospects de eventos públicos de concursos',
        legitimateInterestAssessmentRef: 'LIA-2026-MARKETING-01',
      });
      assert.strictEqual(parsed.success, true);
    });

    it('deve aceitar base CONSENT válida', () => {
      const parsed = importContactsSchema.safeParse({
        text: 'Nome, lead@teste.com, 11987654321',
        legalBasis: 'CONSENT',
        consentProofNotes: 'Formulário de captura de leads na landing page da Black Friday',
      });
      assert.strictEqual(parsed.success, true);
    });

    it('deve validar payload de opt-out (contactOptOutSchema)', () => {
      const invalid = contactOptOutSchema.safeParse({ email: 'invalido' });
      assert.strictEqual(invalid.success, false);

      const valid = contactOptOutSchema.safeParse({ email: 'usuario@teste.com', reason: 'OPT_OUT' });
      assert.strictEqual(valid.success, true);
    });
  });

  describe('Fluxo de Opt-Out e Supressão Criptográfica', () => {
    it('deve registrar opt-out com HMAC-SHA256 do e-mail sem expor o e-mail em texto claro', async () => {
      const result = await adminService.optOutContact(testEmail2, 'Solicitação via rodapé de e-mail');
      assert.strictEqual(result.success, true);

      const expectedHash = hashEmail(testEmail2);
      assert.strictEqual(result.emailHash, expectedHash);
      cleanupHashes.push(expectedHash);

      // Verificar persistência na tabela ContactSuppression
      const suppression = await prisma.contactSuppression.findUnique({
        where: { emailHash: expectedHash },
      });
      assert.ok(suppression);
      assert.strictEqual(suppression.emailHash, expectedHash);
      // Garantir que a tabela não tem o e-mail em texto claro
      assert.strictEqual('email' in suppression, false);
    });

    it('deve marcar unsubscribed = true em contatos existentes ao realizar opt-out', async () => {
      // Inserir contato preliminar
      const contact = await prisma.contact.create({
        data: {
          name: 'Lead Que Vai Pedir Optout',
          email: testEmail1,
          legalBasis: 'CONSENT',
          consentProofNotes: 'Captura prévia em feira de carreiras',
          unsubscribed: false,
        },
      });

      assert.strictEqual(contact.unsubscribed, false);

      // Executar opt-out
      const optOutResult = await adminService.optOutContact(testEmail1);
      cleanupHashes.push(optOutResult.emailHash);

      const updated = await prisma.contact.findUnique({
        where: { id: contact.id },
      });
      assert.ok(updated);
      assert.strictEqual(updated.unsubscribed, true);
    });
  });

  describe('Importação com Filtro de Supressão e Auditoria', () => {
    it('deve pular contatos com e-mail suprimido durante a importação (não reimportar)', async () => {
      // testEmail2 já foi suprimido no teste anterior
      const importPayload = {
        text: `Lead Suprimido, ${testEmail2}, 11911112222\nLead Permitido, ${testEmail3}, 11933334444`,
        legalBasis: 'CONSENT' as const,
        consentProofNotes: 'Importação de lista de webinar de aprovados',
        source: 'webinar_2026',
      };

      const result = await adminService.importContacts(importPayload, {
        adminId: testAdminId,
        ip: '127.0.0.1',
        userAgent: 'NodeTestRunner',
      });

      assert.strictEqual(result.parsed, 2);
      assert.strictEqual(result.skippedSuppressed, 1);
      assert.strictEqual(result.imported, 1);

      // Verificar que o contato permitido foi criado no banco
      const importedContact = await prisma.contact.findFirst({
        where: { email: testEmail3 },
      });
      assert.ok(importedContact);
      assert.strictEqual(importedContact.legalBasis, 'CONSENT');
      assert.strictEqual(importedContact.importedBy, testAdminId);
      assert.strictEqual(importedContact.unsubscribed, false);

      // Verificar que o contato suprimido NÃO foi criado nesta importação
      const supressedContact = await prisma.contact.findFirst({
        where: { email: testEmail2 },
      });
      assert.strictEqual(supressedContact, null);
    });
  });
});
