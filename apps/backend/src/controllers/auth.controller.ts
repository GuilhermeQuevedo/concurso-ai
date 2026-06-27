import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/auth.service.js';
import type { RegisterDTO, LoginDTO, RefreshDTO } from '../validators/auth.validators.js';
import type { ApiResponse, AuthTokens } from '@concurso-ai/types';

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
      const userId = req.userId!;
      const profile = await this.authService.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  };
}
