import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import type { ReminderService } from '../services/reminder.service.js';
import { getUserId } from '../utils/request.js';

export class ReminderController {
  constructor(private readonly service: ReminderService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.list(getUserId(req));
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(getUserId(req), req.body);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(getUserId(req), req.params.id as string, req.body);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.remove(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
