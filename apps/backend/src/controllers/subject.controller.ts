import type { Request, Response, NextFunction } from 'express';
import type { SubjectService } from '../services/subject.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import type { Subject } from '@prisma/client';

export class SubjectController {
  constructor(private readonly service: SubjectService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const subjects = await this.service.getAll();
      const response: ApiResponse<Subject[]> = { success: true, data: subjects };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subject = await this.service.getById(req.params.id as string);
      const response: ApiResponse<Subject> = { success: true, data: subject };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subject = await this.service.create(req.body);
      const response: ApiResponse<Subject> = { success: true, data: subject };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subject = await this.service.update(req.params.id as string, req.body);
      const response: ApiResponse<Subject> = { success: true, data: subject };
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
