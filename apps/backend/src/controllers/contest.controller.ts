import type { Request, Response, NextFunction } from 'express';
import type { ContestService } from '../services/contest.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { AppError } from '../middlewares/error-handler.js';

export class ContestController {
  constructor(private readonly service: ContestService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contest = await this.service.create(req.userId!, req.body);
      const response: ApiResponse<typeof contest> = { success: true, data: contest };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  createFromEdital = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        throw new AppError(400, 'MISSING_FILE', 'Envie o PDF do edital.');
      }
      const contest = await this.service.createFromEdital(req.userId!, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
      });
      const response: ApiResponse<typeof contest> = { success: true, data: contest };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contests = await this.service.listByUser(req.userId!);
      const response: ApiResponse<typeof contests> = { success: true, data: contests };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contest = await this.service.getById(req.userId!, req.params.id as string);
      const response: ApiResponse<typeof contest> = { success: true, data: contest };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contest = await this.service.update(req.userId!, req.params.id as string, req.body);
      const response: ApiResponse<typeof contest> = { success: true, data: contest };
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

  updateSyllabusItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.service.updateSyllabusItem(
        req.userId!,
        req.params.itemId as string,
        req.body.studied,
      );
      const response: ApiResponse<typeof item> = { success: true, data: item };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
