import crypto from 'node:crypto';
import { safeBcryptHash, safeBcryptCompare } from '../utils/crypto-semaphore.js';
import { AUTH } from '@concurso-ai/shared';
import { AppError } from '../middlewares/error-handler.js';
import type { IAuthRepository, AuthTokens } from '../interfaces/auth.interfaces.js';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { EmailService } from './email.service.js';
import { GoogleAuthClient, type GoogleUserProfile } from '../providers/google-auth.client.js';
import { StripeClient } from '../providers/stripe.client.js';
import { GoogleCalendarClient } from '../providers/google-calendar.client.js';
import { isEncrypted, decryptData } from '../utils/crypto.js';
import { sanitizePhone } from '../utils/phone.js';
import { hashIp } from '../utils/mask.js';
import { BruteForceGuard, isPermanentAdminEmail, dummyPasswordCheck } from '../utils/security.js';
import { prisma } from '../database/prisma.js';
import { isOffensiveNickname } from '../utils/nickname.js';
import { AnonymizationService } from './anonymization.service.js';
import type {
  RegisterDTO,
  LoginDTO,
  UpdateProfileDTO,
  ChangePasswordDTO,
  ChangeEmailDTO,
  ResetAccountDTO,
  PauseDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ErasureAccountDTO,
  RecordConsentDTO,
} from '../validators/auth.validators.js';

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: string;
}

export class AuthService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly emailService = new EmailService(),
    private readonly googleAuthClient = new GoogleAuthClient(),
    private readonly stripeClient = new StripeClient(),
    private readonly googleCalendarClient = new GoogleCalendarClient(),
    private readonly anonymizationService = new AnonymizationService(),
  ) {}

  async register(
    dto: RegisterDTO,
    context?: { ip?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'E-mail já cadastrado');
    }

    const isPermanentAdmin = isPermanentAdminEmail(email);
    const hashedPassword = await safeBcryptHash(dto.password, AUTH.BCRYPT_SALT_ROUNDS);

    let user;
    try {
      user = await this.authRepository.createUser({
        name: dto.name,
        email,
        phone: sanitizePhone(dto.phone) ?? undefined,
        password: hashedPassword,
        role: isPermanentAdmin ? 'ADMIN' : 'USER',
      });
    } catch (err: unknown) {
      const prismaErr = err as { code?: string };
      if (prismaErr?.code === 'P2002') {
        throw new AppError(409, 'EMAIL_EXISTS', 'E-mail já cadastrado');
      }
      throw err;
    }

    if (isPermanentAdmin) {
      await this.ensureAdminEntitlement(email);
    }

    // Registro inicial de consentimento dos Termos e Privacidade (v1.0) conforme LGPD Art. 7º, I e Art. 8º
    try {
      const ip = context?.ip || '127.0.0.1';
      const ipHashed = hashIp(ip);
      const userAgent = context?.userAgent ?? null;

      await prisma.consentRecord.createMany({
        data: [
          {
            userId: user.id,
            documentType: 'TERMS',
            version: '1.0',
            ipHash: ipHashed,
            userAgent,
          },
          {
            userId: user.id,
            documentType: 'PRIVACY',
            version: '1.0',
            ipHash: ipHashed,
            userAgent,
          },
        ],
        skipDuplicates: true,
      });
    } catch (consentErr) {
      console.warn('[Consent] Aviso ao registrar consentimento inicial:', consentErr);
    }

    return this.createTokens(user.id, user.role);
  }

  async login(dto: LoginDTO): Promise<AuthTokens> {
    const email = dto.email.toLowerCase().trim();

    // 1. Guardrail Brute-Force: bloqueia se houver excesso de tentativas falhas
    const guard = BruteForceGuard.checkBlocked(email);
    if (guard.isBlocked) {
      throw new AppError(
        429,
        'ACCOUNT_TEMPORARILY_LOCKED',
        `Muitas tentativas inválidas. Conta temporariamente bloqueada por segurança. Tente novamente em ${guard.retryAfterSeconds} segundos.`,
      );
    }

    const user = await this.authRepository.findUserByEmail(email);

    // 2. Guardrail Timing Attack / Enumeração de Contas:
    // Se o usuário não existir, executa o hash simulado para demorar o mesmo tempo e registra tentativa
    if (!user) {
      await dummyPasswordCheck(dto.password);
      BruteForceGuard.recordFailedAttempt(email);
      throw new AppError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos');
    }

    if (user.erasureStatus || user.email.startsWith('deleted_')) {
      throw new AppError(403, 'ACCOUNT_ERASED', 'Esta conta foi excluída ou está em processo de exclusão.');
    }

    if (!user.password) {
      BruteForceGuard.recordFailedAttempt(email);
      throw new AppError(
        400,
        'USE_GOOGLE_LOGIN',
        'Esta conta foi cadastrada via Google. Por favor, utilize o botão "Entrar com Google".',
      );
    }

    const passwordValid = await safeBcryptCompare(dto.password, user.password);
    if (!passwordValid) {
      const attempt = BruteForceGuard.recordFailedAttempt(email);
      if (attempt.isNowBlocked) {
        throw new AppError(
          429,
          'ACCOUNT_TEMPORARILY_LOCKED',
          `Número máximo de tentativas excedido. A conta foi bloqueada por ${Math.ceil(attempt.retryAfterSeconds / 60)} minutos por segurança.`,
        );
      }
      throw new AppError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos');
    }

    // Sucesso: reseta o histórico de falhas
    BruteForceGuard.recordSuccess(email);

    // Se for administrador autorizado mas ainda não estava marcado como ADMIN, sincroniza
    if (isPermanentAdminEmail(email)) {
      if (user.role !== 'ADMIN') {
        await this.authRepository.updateUser(user.id, { role: 'ADMIN' });
        user.role = 'ADMIN';
      }
      await this.ensureAdminEntitlement(email);
    }

    return this.createTokens(user.id, user.role);
  }

  async forgotPassword(dto: ForgotPasswordDTO): Promise<{ success: boolean; message: string; devResetUrl?: string }> {
    const user = await this.authRepository.findUserByEmail(dto.email.toLowerCase().trim());

    // Se o usuário não existe, retornamos sucesso genérico para evitar enumeração de contas
    if (!user) {
      return {
        success: true,
        message: 'Se o e-mail estiver cadastrado, você receberá as instruções em instantes.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;
    await this.emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);

    return {
      success: true,
      message: 'Instruções de redefinição enviadas para o seu e-mail.',
      devResetUrl: env.NODE_ENV === 'development' ? resetUrl : undefined,
    };
  }

  async resetPassword(dto: ResetPasswordDTO): Promise<{ success: boolean; message: string }> {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const validRecord = await this.authRepository.findValidPasswordResetToken(tokenHash);
    if (!validRecord) {
      throw new AppError(400, 'INVALID_OR_EXPIRED_TOKEN', 'Link de redefinição inválido ou expirado.');
    }

    const hashedPassword = await safeBcryptHash(dto.newPassword, AUTH.BCRYPT_SALT_ROUNDS);

    await this.authRepository.consumePasswordResetToken(validRecord.id, validRecord.userId, hashedPassword);

    return {
      success: true,
      message: 'Sua senha foi redefinida com sucesso. Faça login com a nova senha.',
    };
  }

  getGoogleAuthUrl(state = 'login', redirectUri?: string): string {
    return this.googleAuthClient.getAuthUrl(state, redirectUri);
  }

  async handleGoogleCallback(code: string, redirectUri?: string): Promise<{ tokens: AuthTokens; user: UserSummary }> {
    const tokens = await this.googleAuthClient.exchangeCodeForTokens(code, redirectUri);
    const profile = tokens.id_token
      ? await this.googleAuthClient.verifyIdToken(tokens.id_token)
      : await this.googleAuthClient.fetchUserProfile(tokens.access_token);

    return this.loginOrRegisterWithGoogle(profile);
  }

  async loginWithGoogleCredential(credential: string): Promise<{ tokens: AuthTokens; user: UserSummary }> {
    const profile = await this.googleAuthClient.verifyIdToken(credential);
    return this.loginOrRegisterWithGoogle(profile);
  }

  private async loginOrRegisterWithGoogle(profile: GoogleUserProfile): Promise<{ tokens: AuthTokens; user: UserSummary }> {
    const email = profile.email.toLowerCase().trim();
    const isPermanentAdmin = isPermanentAdminEmail(email);

    let user = await this.authRepository.findUserByGoogleId(profile.id);

    if (user) {
      if (user.erasureStatus || user.email.startsWith('deleted_')) {
        throw new AppError(403, 'ACCOUNT_ERASED', 'Esta conta foi excluída ou está em processo de exclusão.');
      }

      const updates: { avatar?: string; role?: 'ADMIN' | 'USER' } = {};
      if (!user.avatar && profile.picture) {
        updates.avatar = profile.picture;
      }
      if (isPermanentAdmin && user.role !== 'ADMIN') {
        updates.role = 'ADMIN';
      }
      if (Object.keys(updates).length > 0) {
        user = await this.authRepository.updateUser(user.id, updates);
      }
    } else {
      user = await this.authRepository.findUserByEmail(email);

      if (user) {
        if (user.erasureStatus || user.email.startsWith('deleted_')) {
          throw new AppError(403, 'ACCOUNT_ERASED', 'Esta conta foi excluída ou está em processo de exclusão.');
        }

        user = await this.authRepository.updateUser(user.id, {
          googleId: profile.id,
          emailVerified: true,
          avatar: user.avatar ?? profile.picture,
          role: isPermanentAdmin ? 'ADMIN' : (user.role as 'ADMIN' | 'USER'),
        });
      } else {
        user = await this.authRepository.createUser({
          name: profile.name,
          email,
          googleId: profile.id,
          avatar: profile.picture,
          role: isPermanentAdmin ? 'ADMIN' : 'USER',
        });
        await this.authRepository.updateUser(user.id, { emailVerified: true });
      }
    }

    if (isPermanentAdmin) {
      await this.ensureAdminEntitlement(email);
    }

    const authTokens = await this.createTokens(user.id, user.role);

    return {
      tokens: authTokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  private async ensureAdminEntitlement(email: string): Promise<void> {
    try {
      const normalized = email.toLowerCase().trim();
      await prisma.entitlement.upsert({
        where: { email: normalized },
        create: {
          email: normalized,
          status: 'ACTIVE',
          provider: 'admin',
          expiresAt: new Date('2099-12-31T23:59:59.999Z'),
        },
        update: {
          status: 'ACTIVE',
          expiresAt: new Date('2099-12-31T23:59:59.999Z'),
        },
      });
    } catch (error) {
      console.error('[Admin Entitlement] Erro ao sincronizar entitlement:', error);
    }
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const session = await this.authRepository.findSessionByToken(refreshToken);
    if (!session) {
      throw new AppError(401, 'INVALID_TOKEN', 'Refresh token inválido');
    }

    if (session.expiresAt < new Date()) {
      await this.authRepository.deleteSession(session.id);
      throw new AppError(401, 'TOKEN_EXPIRED', 'Refresh token expirado');
    }

    await this.authRepository.deleteSession(session.id);

    const user = await this.authRepository.findUserById(session.userId);
    if (!user) {
      throw new AppError(401, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }

    if (user.erasureStatus || user.email.startsWith('deleted_')) {
      throw new AppError(403, 'ACCOUNT_ERASED', 'Esta conta foi excluída ou está em processo de exclusão.');
    }

    return this.createTokens(user.id, user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    const session = await this.authRepository.findSessionByToken(refreshToken);
    if (session) {
      await this.authRepository.deleteSession(session.id);
    }
  }

  async getProfile(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }

    const { password, ...profile } = user;
    void password;
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDTO) {
    const data: { name?: string; dailyGoal?: number; nickname?: string; phone?: string | null } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.dailyGoal !== undefined) data.dailyGoal = dto.dailyGoal;
    if (dto.phone !== undefined) data.phone = sanitizePhone(dto.phone);
    if (dto.nickname !== undefined) {
      if (isOffensiveNickname(dto.nickname)) {
        throw new AppError(400, 'NICKNAME_NOT_ALLOWED', 'Esse nickname não é permitido. Escolha outro.');
      }
      data.nickname = dto.nickname;
    }
    const user = await this.updateUserOrConflict(userId, data);
    const { password, ...profile } = user;
    void password;
    return profile;
  }

  private async updateUserOrConflict(userId: string, data: Parameters<IAuthRepository['updateUser']>[1]) {
    try {
      return await this.authRepository.updateUser(userId, data);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new AppError(409, 'NICKNAME_TAKEN', 'Esse nickname já está em uso.');
      }
      throw error;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDTO): Promise<void> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }
    if (!user.password) {
      throw new AppError(400, 'NO_PASSWORD_SET', 'Defina uma senha usando a recuperação de conta.');
    }
    const valid = await safeBcryptCompare(dto.currentPassword, user.password);
    if (!valid) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Senha atual incorreta');
    }
    const hashed = await safeBcryptHash(dto.newPassword, AUTH.BCRYPT_SALT_ROUNDS);
    await this.authRepository.updateUser(userId, { password: hashed });
  }

  async changeEmail(userId: string, dto: ChangeEmailDTO) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }
    if (!user.password) {
      throw new AppError(400, 'NO_PASSWORD_SET', 'Conta vinculada ao Google sem senha local.');
    }
    const valid = await safeBcryptCompare(dto.password, user.password);
    if (!valid) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Senha incorreta');
    }
    const existing = await this.authRepository.findUserByEmail(dto.newEmail);
    if (existing && existing.id !== userId) {
      throw new AppError(409, 'EMAIL_EXISTS', 'E-mail já cadastrado');
    }
    const updated = await this.authRepository.updateUser(userId, { email: dto.newEmail });
    const { password, ...profile } = updated;
    void password;
    return profile;
  }

  async setPause(userId: string, dto: PauseDTO) {
    const pausedUntil = dto.days > 0 ? new Date(Date.now() + dto.days * 86400000) : null;
    const user = await this.authRepository.updateUser(userId, { pausedUntil });
    const { password, ...profile } = user;
    void password;
    return profile;
  }

  async resetAccount(userId: string, dto: ResetAccountDTO): Promise<void> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }
    if (user.password) {
      const valid = await safeBcryptCompare(dto.password, user.password);
      if (!valid) {
        throw new AppError(400, 'INVALID_PASSWORD', 'Senha incorreta');
      }
    }
    await this.authRepository.resetUserData(userId);
  }

  async validateToken(token: string) {
    return verifyAccessToken(token);
  }

  async exportUserData(userId: string, confirmPassword?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        targetExam: true,
        targetRole: true,
        dailyGoal: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }

    if (user.password && confirmPassword) {
      const valid = await safeBcryptCompare(confirmPassword, user.password);
      if (!valid) {
        throw new AppError(400, 'INVALID_PASSWORD', 'Senha incorreta para exportação');
      }
    }

    const [
      consents,
      sessions,
      attempts,
      notes,
      favorites,
      flashcardDecks,
      flashcards,
      essays,
      studyPlans,
      studyTasks,
      payments,
    ] = await Promise.all([
      prisma.consentRecord.findMany({
        where: { userId },
        select: {
          id: true,
          documentType: true,
          version: true,
          acceptedAt: true,
        },
      }),
      prisma.studySession.findMany({
        where: { userId },
        select: {
          id: true,
          subjectId: true,
          mode: true,
          totalTime: true,
          questionsCount: true,
          correctCount: true,
          difficulty: true,
          createdAt: true,
          finishedAt: true,
        },
      }),
      prisma.questionAttempt.findMany({
        where: { userId },
        select: {
          id: true,
          questionId: true,
          answer: true,
          isCorrect: true,
          timeSpent: true,
          createdAt: true,
        },
      }),
      prisma.note.findMany({
        where: { userId },
        select: {
          id: true,
          questionId: true,
          subjectId: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.favorite.findMany({
        where: { userId },
        select: {
          id: true,
          questionId: true,
          createdAt: true,
        },
      }),
      prisma.flashcardDeck.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          topic: true,
          color: true,
          createdAt: true,
        },
      }),
      prisma.flashcard.findMany({
        where: { userId },
        select: {
          id: true,
          deckId: true,
          subjectId: true,
          front: true,
          back: true,
          easeFactor: true,
          interval: true,
          repetition: true,
          nextReview: true,
          createdAt: true,
        },
      }),
      prisma.essay.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          theme: true,
          content: true,
          feedback: true,
          score: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.studyPlan.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          active: true,
          createdAt: true,
        },
      }),
      prisma.studyTask.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          discipline: true,
          type: true,
          date: true,
          duration: true,
          completed: true,
          createdAt: true,
        },
      }),
      prisma.payment.findMany({
        where: { email: user.email },
        select: {
          id: true,
          event: true,
          amountCents: true,
          currency: true,
          status: true,
          provider: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      exportMetadata: {
        requestedAt: new Date().toISOString(),
        legalNotice:
          'Exportação de dados pessoais em formato interoperável estruturado (JSON), em conformidade com o Art. 18, II e V da Lei Geral de Proteção de Dados (Lei 13.709/2018 - LGPD).',
      },
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        targetExam: user.targetExam,
        targetRole: user.targetRole,
        dailyGoal: user.dailyGoal,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      consents,
      studySessions: sessions,
      questionAttempts: attempts,
      notes,
      favorites,
      flashcardDecks,
      flashcards,
      essays,
      studyPlans,
      studyTasks,
      payments,
    };
  }

  async eraseAccount(
    userId: string,
    dto: ErasureAccountDTO,
  ): Promise<{ success: boolean; message: string }> {
    const userHash = crypto.createHash('sha256').update(userId).digest('hex');

    // 0. Idempotência: verifica se a conta já foi eliminada anteriormente
    const existingLog = await prisma.erasureLog.findUnique({
      where: { userHash },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      if (existingLog) {
        return {
          success: true,
          message: 'Solicitação de eliminação concluída conforme o Art. 18 da LGPD.',
        };
      }
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }

    if (user.erasureStatus === 'COMPLETED') {
      return {
        success: true,
        message: 'Solicitação de eliminação concluída conforme o Art. 18 da LGPD.',
      };
    }

    // Validação de senha para contas com senha definida
    if (user.password) {
      if (!dto.password) {
        throw new AppError(400, 'PASSWORD_REQUIRED', 'Senha obrigatória para confirmar a exclusão da conta.');
      }
      const valid = await safeBcryptCompare(dto.password, user.password);
      if (!valid) {
        throw new AppError(400, 'INVALID_PASSWORD', 'Senha incorreta');
      }
    }

    // PASSO 1: Persistir erasureRequestedAt e erasureStatus = 'STARTED'
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          erasureRequestedAt: user.erasureRequestedAt ?? new Date(),
          erasureStatus: 'STARTED',
        },
      });
    } catch {
      // Ignora erro eventual de persistência inicial
    }

    // PASSO 2: Cancelar assinatura no Stripe com chave de idempotência e anonimizar no operador
    const anonymizedEmail = `deleted_${crypto.randomUUID()}@engrama.internal`;

    if (user.stripeCustomerId) {
      try {
        await this.stripeClient.cancelCustomerSubscriptions(user.stripeCustomerId, `erasure:${userId}`);
        await this.stripeClient.anonymizeCustomer(user.stripeCustomerId, anonymizedEmail);
      } catch (stripeErr) {
        console.error('[DSAR Erasure] Erro ao cancelar assinatura ou anonimizar no Stripe:', stripeErr);
        await prisma.user.update({
          where: { id: userId },
          data: { erasureStatus: 'FAILED_AT_STEP_2' },
        }).catch(() => {});
        throw new AppError(500, 'ERASURE_STRIPE_FAILED', 'Falha ao cancelar assinatura ou anonimizar no operador externo. Tente novamente.');
      }
    }

    // PASSO 3: Revogar tokens OAuth do Google e apagar integração de calendário
    try {
      const calendar = await prisma.userCalendarIntegration.findUnique({
        where: { userId },
      });
      if (calendar?.googleRefreshToken) {
        let refreshToken = calendar.googleRefreshToken;
        if (isEncrypted(refreshToken)) {
          try {
            refreshToken = decryptData(refreshToken, userId);
          } catch {
            // Decrypt falhou; ignora para prosseguir
          }
        }
        await this.googleCalendarClient.revokeToken(refreshToken);
      }
      if (calendar) {
        await prisma.userCalendarIntegration.delete({
          where: { userId },
        });
      }
    } catch (googleErr) {
      console.warn('[DSAR Erasure] Falha não impeditiva ao revogar Google OAuth:', googleErr);
    }

    // PASSO 4: Transação de banco via AnonymizationService unificado (Art. 16, I da LGPD)
    let hadPayments = false;
    try {
      const erasureResult = await this.anonymizationService.executeUserErasure(userId, user.email, anonymizedEmail);
      hadPayments = erasureResult.hadPayments;
    } catch (dbErr) {
      console.error('[DSAR Erasure] Erro ao executar transação de banco:', dbErr);
      await prisma.user.update({
        where: { id: userId },
        data: { erasureStatus: 'FAILED_AT_STEP_4' },
      }).catch(() => {});
      throw new AppError(500, 'ERASURE_DB_FAILED', 'Falha ao excluir dados no banco de dados. Tente novamente.');
    }

    // PASSO 5 & 6: Invalidação de sessões e registro em ErasureLog
    try {
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.erasureLog.upsert({
        where: { userHash },
        create: {
          userHash,
          erasedAt: new Date(),
          hadPayments,
          reason: dto.reason ?? null,
        },
        update: {
          erasedAt: new Date(),
          hadPayments,
          reason: dto.reason ?? null,
        },
      });
    } catch (logErr) {
      console.error('[DSAR Erasure] Aviso ao registrar log de erasure:', logErr);
    }

    return {
      success: true,
      message: 'Solicitação de eliminação concluída conforme o Art. 18 da LGPD.',
    };
  }

  async recordConsent(
    userId: string,
    dto: RecordConsentDTO,
    context?: { ip?: string; userAgent?: string },
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }

    const ip = context?.ip || '127.0.0.1';
    const ipHashed = hashIp(ip);
    const userAgent = context?.userAgent ?? null;

    return prisma.consentRecord.upsert({
      where: {
        userId_documentType_version: {
          userId,
          documentType: dto.documentType,
          version: dto.version,
        },
      },
      create: {
        userId,
        documentType: dto.documentType,
        version: dto.version,
        acceptedAt: new Date(),
        ipHash: ipHashed,
        userAgent,
      },
      update: {
        acceptedAt: new Date(),
        ipHash: ipHashed,
        userAgent,
      },
    });
  }

  private async createTokens(userId: string, role: string, tokenVersion?: number): Promise<AuthTokens> {
    if (tokenVersion === undefined) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { tokenVersion: true } });
      tokenVersion = u?.tokenVersion ?? 0;
    }
    const accessToken = await generateAccessToken({ userId, role, tokenVersion });
    const refreshTokenValue = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + AUTH.REFRESH_TOKEN_EXPIRY_DAYS);

    await this.authRepository.createSession({
      userId,
      refreshToken: refreshTokenValue,
      expiresAt,
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }
}
