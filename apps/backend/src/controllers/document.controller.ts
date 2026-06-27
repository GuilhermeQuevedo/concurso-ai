import type { Request, Response, NextFunction } from 'express';
import type { DocumentService } from '../services/document.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { AppError } from '../middlewares/error-handler.js';

export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'NO_FILE', 'Nenhum arquivo enviado');
      }
      const subjectId = req.body.subjectId as string | undefined;
      const doc = await this.service.upload(req.userId!, req.file, subjectId);
      const response: ApiResponse<typeof doc> = { success: true, data: doc };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subjectId = req.query.subjectId as string | undefined;
      const docs = await this.service.list(req.userId!, subjectId);
      const response: ApiResponse<typeof docs> = { success: true, data: docs };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await this.service.getById(req.userId!, req.params.id as string);
      const response: ApiResponse<typeof doc> = { success: true, data: doc };
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
}
