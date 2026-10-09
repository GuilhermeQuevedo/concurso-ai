import type { Request, Response, NextFunction } from 'express';
import type { AdminService } from '../services/admin.service.js';
import type { ApiResponse } from '@concurso-ai/types';

export class AdminController {
  constructor(private readonly service: AdminService) {}

  overview = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getOverview();
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  users = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getUsers();
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
