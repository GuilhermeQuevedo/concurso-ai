import type { Request, Response, NextFunction } from 'express';
import type { StudyTaskService } from '../services/study-task.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';

export class StudyTaskController {
  constructor(private readonly service: StudyTaskService) {}

  generatePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.generatePlan(getUserId(req), req.body);
      const response: ApiResponse<typeof result> = { success: true, data: result };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await this.service.list(
        getUserId(req),
        req.query.from as string | undefined,
        req.query.to as string | undefined,
      );
      const response: ApiResponse<typeof tasks> = { success: true, data: tasks };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  today = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await this.service.today(getUserId(req));
      const response: ApiResponse<typeof tasks> = { success: true, data: tasks };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await this.service.setCompleted(
        getUserId(req),
        req.params.id as string,
        req.body.completed,
      );
      const response: ApiResponse<typeof task> = { success: true, data: task };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  clearPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.clearPlan(getUserId(req), req.params.contestId as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
