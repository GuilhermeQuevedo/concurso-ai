import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { AUTH } from '@concurso-ai/shared';
import { AppError } from '../middlewares/error-handler.js';
import type { IAuthRepository, AuthTokens } from '../interfaces/auth.interfaces.js';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { EmailService } from './email.service.js';
import { GoogleAuthClient, type GoogleUserProfile } from '../providers/google-auth.client.js';
import { BruteForceGuard, isPermanentAdminEmail, dummyPasswordCheck } from '../utils/security.js';
import { prisma } from '../database/prisma.js';
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
  ) {}

  async register(dto: RegisterDTO): Promise<AuthTokens> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'E-mail já cadastrado');
    }

    const isPermanentAdmin = isPermanentAdminEmail(email);
    const hashedPassword = await bcrypt.hash(dto.password, AUTH.BCRYPT_SALT_ROUNDS);

    const user = await this.authRepository.createUser({
      name: dto.name,
      email,
      phone: dto.phone,
      password: hashedPassword,
      role: isPermanentAdmin ? 'ADMIN' : 'USER',
    });

    if (isPermanentAdmin) {
      await this.ensureAdminEntitlement(email);
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

    if (!user.password) {
      BruteForceGuard.recordFailedAttempt(email);
      throw new AppError(
        400,
        'USE_GOOGLE_LOGIN',
        'Esta conta foi cadastrada via Google. Por favor, utilize o botão "Entrar com Google".',
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
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

    const hashedPassword = await bcrypt.hash(dto.newPassword, AUTH.BCRYPT_SALT_ROUNDS);

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
    const data: { name?: string; dailyGoal?: number } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.dailyGoal !== undefined) data.dailyGoal = dto.dailyGoal;
    const user = await this.authRepository.updateUser(userId, data);
    const { password, ...profile } = user;
    void password;
    return profile;
  }

  async changePassword(userId: string, dto: ChangePasswordDTO): Promise<void> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado');
    }
    if (!user.password) {
      throw new AppError(400, 'NO_PASSWORD_SET', 'Defina uma senha usando a recuperação de conta.');
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Senha atual incorreta');
    }
    const hashed = await bcrypt.hash(dto.newPassword, AUTH.BCRYPT_SALT_ROUNDS);
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
    const valid = await bcrypt.compare(dto.password, user.password);
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
      const valid = await bcrypt.compare(dto.password, user.password);
      if (!valid) {
        throw new AppError(400, 'INVALID_PASSWORD', 'Senha incorreta');
      }
    }
    await this.authRepository.resetUserData(userId);
  }

  async validateToken(token: string) {
    return verifyAccessToken(token);
  }

  private async createTokens(userId: string, role: string): Promise<AuthTokens> {
    const accessToken = await generateAccessToken({ userId, role });
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
