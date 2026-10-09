import type { Request, Response, NextFunction } from 'express';
import type { AdminService } from '../services/admin.service.js';
import type { ApiResponse } from '@concurso-ai/types';

export class AdminController {
  constructor(private readonly service: AdminService) {}

  overview = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getOverview();
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  users = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getUsers();
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  importContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const raw = typeof req.body?.text === 'string' ? req.body.text : '';
      const source = typeof req.body?.source === 'string' ? req.body.source : undefined;
      const data = await this.service.importContacts(raw, source);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  listContacts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.listContacts();
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteContact(req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
