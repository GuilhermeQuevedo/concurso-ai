import type { Request, Response, NextFunction } from 'express';
import type { ExamBoardService } from '../services/exam-board.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import type { ExamBoard } from '@prisma/client';

export class ExamBoardController {
  constructor(private readonly service: ExamBoardService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const boards = await this.service.getAll();
      const response: ApiResponse<ExamBoard[]> = { success: true, data: boards };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const board = await this.service.getById(req.params.id as string);
      const response: ApiResponse<ExamBoard> = { success: true, data: board };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const board = await this.service.create(req.body);
      const response: ApiResponse<ExamBoard> = { success: true, data: board };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const board = await this.service.update(req.params.id as string, req.body);
      const response: ApiResponse<ExamBoard> = { success: true, data: board };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
