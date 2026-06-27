import type { Request, Response, NextFunction } from 'express';
import type { StudyService } from '../services/study.service.js';
import type { ApiResponse } from '@concurso-ai/types';

export class StudyController {
  constructor(private readonly service: StudyService) {}

  createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createSession(req.userId!, req.body);
      const response: ApiResponse<typeof result> = { success: true, data: result };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.submitAnswer(req.userId!, req.params.sessionId as string, req.body);
      const response: ApiResponse<typeof result> = { success: true, data: result };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  finishSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.finishSession(req.userId!, req.params.sessionId as string);
      const response: ApiResponse<typeof result> = { success: true, data: result };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.toggleFavorite(req.userId!, req.body.questionId);
      const response: ApiResponse<typeof result> = { success: true, data: result };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getUserStats(req.userId!);
      const response: ApiResponse<typeof stats> = { success: true, data: stats };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await this.service.getSessionHistory(req.userId!);
      const response: ApiResponse<typeof sessions> = { success: true, data: sessions };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
