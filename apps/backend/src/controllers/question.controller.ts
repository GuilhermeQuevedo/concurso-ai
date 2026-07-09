import type { Request, Response, NextFunction } from 'express';
import type { QuestionService } from '../services/question.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';

export class QuestionController {
  constructor(private readonly service: QuestionService) {}

  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const questions = await this.service.generate(getUserId(req), req.body);
      const response: ApiResponse<typeof questions> = { success: true, data: questions };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getBySubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const questions = await this.service.getBySubject(req.params.subjectId as string);
      const response: ApiResponse<typeof questions> = { success: true, data: questions };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const question = await this.service.getById(req.params.id as string);
      const response: ApiResponse<typeof question> = { success: true, data: question };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
