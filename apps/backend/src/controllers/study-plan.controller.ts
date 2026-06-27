import type { Request, Response, NextFunction } from 'express';
import type { StudyPlanService } from '../services/study-plan.service.js';
import type { ApiResponse } from '@concurso-ai/types';

export class StudyPlanController {
  constructor(private readonly service: StudyPlanService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await this.service.create(req.userId!, req.body);
      const response: ApiResponse<typeof plan> = { success: true, data: plan };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await this.service.getActive(req.userId!);
      const response: ApiResponse<typeof plan> = { success: true, data: plan };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await this.service.list(req.userId!);
      const response: ApiResponse<typeof plans> = { success: true, data: plans };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  toggleItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.service.toggleItemComplete(req.userId!, req.params.itemId as string);
      const response: ApiResponse<typeof item> = { success: true, data: item };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.userId!, req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  suggest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const suggestion = await this.service.generateSuggestion(req.userId!);
      const response: ApiResponse<typeof suggestion> = { success: true, data: suggestion };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
