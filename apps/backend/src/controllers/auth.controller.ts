import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/auth.service.js';
import { env } from '../config/env.js';
import type {
  RegisterDTO,
  LoginDTO,
  RefreshDTO,
  UpdateProfileDTO,
  ChangePasswordDTO,
  ChangeEmailDTO,
  ResetAccountDTO,
  PauseDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  GoogleCredentialDTO,
} from '../validators/auth.validators.js';
import type { ApiResponse, AuthTokens } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response<ApiResponse<AuthTokens>>, next: NextFunction) => {
    try {
      const dto = req.body as RegisterDTO;
      const tokens = await this.authService.register(dto);
      res.status(201).json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response<ApiResponse<AuthTokens>>, next: NextFunction) => {
    try {
      const dto = req.body as LoginDTO;
      const tokens = await this.authService.login(dto);
      res.json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = req.body as ForgotPasswordDTO;
      const result = await this.authService.forgotPassword(dto);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = req.body as ResetPasswordDTO;
      const result = await this.authService.resetPassword(dto);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  googleAuthUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = (req.query.state as string) || 'login';
      const redirectUri = req.query.redirectUri as string | undefined;
      const url = this.authService.getGoogleAuthUrl(state, redirectUri);
      res.json({ success: true, data: { url } });
    } catch (error) {
      next(error);
    }
  };

  googleCallback = async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string | undefined;
      if (!code) {
        return res.redirect(`${env.APP_URL}/login?error=google_missing_code`);
      }

      const { tokens } = await this.authService.handleGoogleCallback(code);
      const params = new URLSearchParams({
        google_auth: 'success',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      return res.redirect(`${env.APP_URL}/login?${params.toString()}`);
    } catch (error) {
      console.error('❌ [Google Callback Error]:', error);
      const message = error instanceof Error ? error.message : 'Falha ao autenticar com Google';
      return res.redirect(`${env.APP_URL}/login?error=${encodeURIComponent(message)}`);
    }
  };

  googleCredential = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { credential } = req.body as GoogleCredentialDTO;
      const result = await this.authService.loginWithGoogleCredential(credential);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response<ApiResponse<AuthTokens>>, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as RefreshDTO;
      const tokens = await this.authService.refresh(refreshToken);
      res.json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as RefreshDTO;
      await this.authService.logout(refreshToken);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  profile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const profile = await this.authService.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.authService.updateProfile(getUserId(req), req.body as UpdateProfileDTO);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.changePassword(getUserId(req), req.body as ChangePasswordDTO);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  };

  changeEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.authService.changeEmail(getUserId(req), req.body as ChangeEmailDTO);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  };

  setPause = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.authService.setPause(getUserId(req), req.body as PauseDTO);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  };

  resetAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.resetAccount(getUserId(req), req.body as ResetAccountDTO);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  };
}
