import type { Request, Response, NextFunction } from 'express';
import type { StudyTaskService } from '../services/study-task.service.js';
import type { ApiResponse } from '@concurso-ai/types';

export class StudyTaskController {
  constructor(private readonly service: StudyTaskService) {}

  generatePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.generatePlan(req.userId!, req.body);
      const response: ApiResponse<typeof result> = { success: true, data: result };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await this.service.list(
        req.userId!,
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
      const tasks = await this.service.today(req.userId!);
      const response: ApiResponse<typeof tasks> = { success: true, data: tasks };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await this.service.setCompleted(
        req.userId!,
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
      await this.service.clearPlan(req.userId!, req.params.contestId as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
