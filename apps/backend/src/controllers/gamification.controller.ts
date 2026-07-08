import type { Request, Response, NextFunction } from 'express';
import type { GamificationService } from '../services/gamification.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';

export class GamificationController {
  constructor(private readonly service: GamificationService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.service.getProfile(getUserId(req));
      const response: ApiResponse<typeof profile> = { success: true, data: profile };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  checkAchievements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newAchievements = await this.service.checkAchievements(getUserId(req));
      const response: ApiResponse<typeof newAchievements> = { success: true, data: newAchievements };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
