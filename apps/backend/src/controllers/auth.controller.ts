import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/auth.service.js';
import type {
  RegisterDTO,
  LoginDTO,
  RefreshDTO,
  UpdateProfileDTO,
  ChangePasswordDTO,
  ChangeEmailDTO,
  ResetAccountDTO,
  PauseDTO,
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
