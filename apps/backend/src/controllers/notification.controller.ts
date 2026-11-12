import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import type { NotificationService } from '../services/notification.service.js';
import { getUserId } from '../utils/request.js';

export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.list(getUserId(req));
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.markRead(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  markAllRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.markAllRead(getUserId(req));
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
