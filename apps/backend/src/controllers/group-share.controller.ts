import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import type { GroupShareContentService } from '../services/group-share-content.service.js';
import type { GroupShareService } from '../services/group-share.service.js';
import { getUserId } from '../utils/request.js';

export class GroupShareController {
  constructor(
    private readonly shares: GroupShareService,
    private readonly content: GroupShareContentService,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.shares.list(getUserId(req), req.params.id as string);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.shares.create(getUserId(req), req.params.id as string, req.body.type, req.body.refId);
      const response: ApiResponse<null> = { success: true, data: null };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.shares.remove(getUserId(req), req.params.id as string, req.params.shareId as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.content.detail(getUserId(req), req.params.id as string, req.params.shareId as string);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  copy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.content.copy(getUserId(req), req.params.id as string, req.params.shareId as string);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
