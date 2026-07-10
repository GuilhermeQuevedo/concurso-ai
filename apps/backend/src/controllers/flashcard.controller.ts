import type { Request, Response, NextFunction } from 'express';
import type { FlashcardService } from '../services/flashcard.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';

export class FlashcardController {
  constructor(private readonly service: FlashcardService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const card = await this.service.create(getUserId(req), req.body);
      const response: ApiResponse<typeof card> = { success: true, data: card };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cards = await this.service.generateFromContent(getUserId(req), req.body);
      const response: ApiResponse<typeof cards> = { success: true, data: cards };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  import = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.importCards(getUserId(req), req.body);
      const response: ApiResponse<typeof result> = { success: true, data: result };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getDue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subjectId = req.query.subjectId as string | undefined;
      const cards = await this.service.getDueCards(getUserId(req), subjectId);
      const response: ApiResponse<typeof cards> = { success: true, data: cards };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  review = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const card = await this.service.review(getUserId(req), req.params.id as string, req.body);
      const response: ApiResponse<typeof card> = { success: true, data: card };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subjectId = req.query.subjectId as string | undefined;
      const cards = await this.service.list(getUserId(req), subjectId);
      const response: ApiResponse<typeof cards> = { success: true, data: cards };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStats(getUserId(req));
      const response: ApiResponse<typeof stats> = { success: true, data: stats };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
