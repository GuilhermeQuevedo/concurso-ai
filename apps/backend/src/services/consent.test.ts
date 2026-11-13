import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from './auth.service.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { registerSchema, recordConsentSchema } from '../validators/auth.validators.js';
import { prisma } from '../database/prisma.js';
import { hashIp } from '../utils/mask.js';

describe('Gestão de Consentimento e Documentos Legais (Gaps G02, G05, G08)', () => {
  const authRepository = new AuthRepository();
  const authService = new AuthService(authRepository);

  const createdUserIds: string[] = [];

  after(async () => {
    if (createdUserIds.length > 0) {
      await prisma.consentRecord.deleteMany({
        where: { userId: { in: createdUserIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
  });

  describe('Validação Zod de Aceite de Termos e Privacidade', () => {
    const validBase = {
      name: 'Aluno Teste',
      email: 'aluno.consent@teste.com',
      password: 'StrongPassword123!',
      acceptTerms: true,
      acceptPrivacy: true,
    };

    it('deve aceitar payload com termos e privacidade aceitos', () => {
      const parsed = registerSchema.safeParse(validBase);
      assert.strictEqual(parsed.success, true);
    });

    it('deve rejeitar cadastro caso acceptTerms seja false', () => {
      const parsed = registerSchema.safeParse({
        ...validBase,
        acceptTerms: false,
      });
      assert.strictEqual(parsed.success, false);
      if (!parsed.success) {
        const err = parsed.error.issues.find((i) => i.path.includes('acceptTerms'));
        assert.ok(err);
        assert.strictEqual(err.message, 'É obrigatório aceitar os Termos de Uso.');
      }
    });

    it('deve rejeitar cadastro caso acceptPrivacy seja false', () => {
      const parsed = registerSchema.safeParse({
        ...validBase,
        acceptPrivacy: false,
      });
      assert.strictEqual(parsed.success, false);
      if (!parsed.success) {
        const err = parsed.error.issues.find((i) => i.path.includes('acceptPrivacy'));
        assert.ok(err);
        assert.strictEqual(err.message, 'É obrigatório aceitar a Política de Privacidade.');
      }
    });

    it('deve rejeitar cadastro caso acceptAgeOrGuardian seja false (ECA Digital / Gap G13)', () => {
      const parsed = registerSchema.safeParse({
        ...validBase,
        acceptAgeOrGuardian: false,
      });
      assert.strictEqual(parsed.success, false);
      if (!parsed.success) {
        const err = parsed.error.issues.find((i) => i.path.includes('acceptAgeOrGuardian'));
        assert.ok(err);
        assert.ok(err.message.includes('maior de 18 anos'));
      }
    });

    it('deve aceitar payload com acceptAgeOrGuardian = true', () => {
      const parsed = registerSchema.safeParse({
        ...validBase,
        acceptAgeOrGuardian: true,
      });
      assert.strictEqual(parsed.success, true);
    });
  });

  describe('AuthService.register (Gravação Automática de ConsentRecords)', () => {
    it('deve gravar automaticamente registros de TERMS e PRIVACY v1.0 com ipHash criptografado', async () => {
      const testEmail = `test_consent_${Date.now()}@example.com`;
      const rawIp = '189.100.20.10';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser/1.0';

      const tokens = await authService.register(
        {
          name: 'Candidato Aprovado',
          email: testEmail,
          password: 'StrongPassword123!',
          acceptTerms: true,
          acceptPrivacy: true,
          acceptAgeOrGuardian: true,
        },
        {
          ip: rawIp,
          userAgent,
        },
      );

      assert.ok(tokens.accessToken);

      const user = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { consentRecords: true },
      });
      assert.ok(user);
      createdUserIds.push(user.id);

      // Deve ter exatamente 2 registros de consentimento
      assert.strictEqual(user.consentRecords.length, 2);

      const termsRecord = user.consentRecords.find((r) => r.documentType === 'TERMS');
      const privacyRecord = user.consentRecords.find((r) => r.documentType === 'PRIVACY');

      assert.ok(termsRecord, 'Registro de TERMS deve existir');
      assert.ok(privacyRecord, 'Registro de PRIVACY deve existir');

      assert.strictEqual(termsRecord.version, '1.0');
      assert.strictEqual(privacyRecord.version, '1.0');

      // Verificação rigorosa de ipHash: NUNCA gravar IP em claro
      const expectedIpHash = hashIp(rawIp);
      assert.strictEqual(termsRecord.ipHash, expectedIpHash);
      assert.strictEqual(privacyRecord.ipHash, expectedIpHash);
      assert.notStrictEqual(termsRecord.ipHash, rawIp, 'IP não pode ser armazenado em claro');

      // User Agent gravado com sucesso
      assert.strictEqual(termsRecord.userAgent, userAgent);
      assert.strictEqual(privacyRecord.userAgent, userAgent);
    });
  });

  describe('AuthService.recordConsent (Atualização e Idempotência)', () => {
    it('deve registrar novo consentimento para nova versão do documento', async () => {
      const testEmail = `test_consent_update_${Date.now()}@example.com`;
      const tokens = await authService.register({
        name: 'Usuário Consentimento',
        email: testEmail,
        password: 'StrongPassword123!',
        acceptTerms: true,
        acceptPrivacy: true,
        acceptAgeOrGuardian: true,
      });
      assert.ok(tokens.accessToken);

      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      assert.ok(user);
      createdUserIds.push(user.id);

      const parsedSchema = recordConsentSchema.safeParse({
        documentType: 'TERMS',
        version: '2.0',
      });
      assert.strictEqual(parsedSchema.success, true);

      // Gravação do novo consentimento
      const record = await authService.recordConsent(
        user.id,
        { documentType: 'TERMS', version: '2.0' },
        { ip: '201.50.30.2', userAgent: 'ConsentUpdater/2.0' },
      );

      assert.strictEqual(record.documentType, 'TERMS');
      assert.strictEqual(record.version, '2.0');
      assert.strictEqual(record.ipHash, hashIp('201.50.30.2'));

      // IDEMPOTÊNCIA: Registrar a mesma versão novamente deve atualizar sem disparar erro
      const reRecord = await authService.recordConsent(
        user.id,
        { documentType: 'TERMS', version: '2.0' },
        { ip: '201.50.30.3', userAgent: 'ConsentUpdater/2.0-Retry' },
      );

      assert.strictEqual(reRecord.id, record.id, 'Deve atualizar o mesmo registro');
      assert.strictEqual(reRecord.ipHash, hashIp('201.50.30.3'));
    });
  });
});
