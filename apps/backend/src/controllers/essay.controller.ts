import type { Request, Response, NextFunction } from 'express';
import type { EssayService } from '../services/essay.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';

export class EssayController {
  constructor(private readonly service: EssayService) {}

  submit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file as Express.Multer.File | undefined;
      const essay = await this.service.submit(getUserId(req), {
        dto: req.body,
        file: file ? { path: file.path, originalname: file.originalname, mimetype: file.mimetype } : undefined,
      });
      const response: ApiResponse<typeof essay> = { success: true, data: essay };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const essays = await this.service.listByUser(getUserId(req));
      const response: ApiResponse<typeof essays> = { success: true, data: essays };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const essay = await this.service.getById(getUserId(req), req.params.id as string);
      const response: ApiResponse<typeof essay> = { success: true, data: essay };
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
}
