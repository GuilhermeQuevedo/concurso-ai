import type { Request, Response, NextFunction } from 'express';
import type { QuestionSetService } from '../services/question-set.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';

export class QuestionSetController {
  constructor(private readonly service: QuestionSetService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sets = await this.service.list(getUserId(req));
      const response: ApiResponse<typeof sets> = { success: true, data: sets };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const set = await this.service.generate(getUserId(req), req.body);
      const response: ApiResponse<typeof set> = { success: true, data: set };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  createManual = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const set = await this.service.createManual(getUserId(req), req.body);
      const response: ApiResponse<typeof set> = { success: true, data: set };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const set = await this.service.getById(getUserId(req), req.params.id as string);
      const response: ApiResponse<typeof set> = { success: true, data: set };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
