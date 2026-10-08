import type { Request, Response, NextFunction } from 'express';
import type { DashboardService } from '../services/dashboard.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await this.service.getSummary(getUserId(req));
      const response: ApiResponse<typeof summary> = { success: true, data: summary };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  setDailyGoal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.setDailyGoal(getUserId(req), req.body.dailyGoal);
      const response: ApiResponse<typeof result> = { success: true, data: result };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
