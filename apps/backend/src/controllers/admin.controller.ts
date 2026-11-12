import type { Request, Response, NextFunction } from 'express';
import type { AdminService } from '../services/admin.service.js';
import type { AdminAccessService } from '../services/admin-access.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import {
  adminPaginationSchema,
  revealPiiSchema,
  importContactsSchema,
  contactOptOutSchema,
} from '../validators/admin.validators.js';
import { AppError } from '../middlewares/error-handler.js';

export class AdminController {
  constructor(
    private readonly service: AdminService,
    private readonly access: AdminAccessService,
  ) {}

  overview = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getOverview();
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  users = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = adminPaginationSchema.parse(req.query);
      const data = await this.service.getUsers(query, req.auditContext);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  revealUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auditContext) {
        throw new AppError(401, 'AUDIT_CONTEXT_MISSING', 'Contexto de auditoria ausente');
      }
      const body = revealPiiSchema.parse(req.body);
      const userId = req.params.id as string;
      const data = await this.service.revealUserPii(userId, body.justification, req.auditContext);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  importContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = importContactsSchema.parse(req.body);
      const data = await this.service.importContacts(dto, req.auditContext);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  optOutContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = contactOptOutSchema.parse(req.body);
      const data = await this.service.optOutContact(dto.email, dto.reason);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  listContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = adminPaginationSchema.parse(req.query);
      const data = await this.service.listContacts(query, req.auditContext);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  revealContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auditContext) {
        throw new AppError(401, 'AUDIT_CONTEXT_MISSING', 'Contexto de auditoria ausente');
      }
      const body = revealPiiSchema.parse(req.body);
      const contactId = req.params.id as string;
      const data = await this.service.revealContactPii(contactId, body.justification, req.auditContext);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteContact(req.params.id as string, req.auditContext);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  listAccess = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.access.listManual();
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  grantAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.access.grant(req.body.email, req.body.days);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  revokeAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.access.revoke(req.body.email);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
