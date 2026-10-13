import type { Request, Response, NextFunction } from 'express';
import type { RankingService } from '../services/ranking.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';

export class RankingController {
  constructor(private readonly service: RankingService) {}

  suggest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const board = await this.service.suggest(getUserId(req), req.body);
      const response: ApiResponse<typeof board> = { success: true, data: board };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  listApproved = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const boards = await this.service.listApproved();
      const response: ApiResponse<typeof boards> = { success: true, data: boards };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  leaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.leaderboard(req.params.id as string, getUserId(req));
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  join = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.join(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  leave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.leave(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  listPending = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const boards = await this.service.listPending();
      const response: ApiResponse<typeof boards> = { success: true, data: boards };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const board = await this.service.setStatus(req.params.id as string, getUserId(req), 'APPROVED');
      const response: ApiResponse<typeof board> = { success: true, data: board };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const board = await this.service.setStatus(req.params.id as string, getUserId(req), 'REJECTED');
      const response: ApiResponse<typeof board> = { success: true, data: board };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
