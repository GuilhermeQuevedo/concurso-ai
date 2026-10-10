import bcrypt from 'bcrypt';
import { AUTH } from '@concurso-ai/shared';
import { AppError } from '../middlewares/error-handler.js';
import type { IAuthRepository, AuthTokens } from '../interfaces/auth.interfaces.js';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../utils/jwt.js';
import type {
  RegisterDTO,
  LoginDTO,
  UpdateProfileDTO,
  ChangePasswordDTO,
  ChangeEmailDTO,
} from '../validators/auth.validators.js';

export class AuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  async register(dto: RegisterDTO): Promise<AuthTokens> {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, AUTH.BCRYPT_SALT_ROUNDS);

    const user = await this.authRepository.createUser({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
    });

    return this.createTokens(user.id, user.role);
  }

  async login(dto: LoginDTO): Promise<AuthTokens> {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos');
    }

    return this.createTokens(user.id, user.role);
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
