import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import type { GroupCommentService, ListFilter } from '../services/group-comment.service.js';
import { getUserId } from '../utils/request.js';

export class GroupCommentController {
  constructor(private readonly service: GroupCommentService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query as Record<string, string | undefined>;
      const filter: ListFilter = {
        targetType: query.targetType as ListFilter['targetType'],
        targetId: query.targetId,
        onlyOpenHelp: query.open === 'true',
      };
      const data = await this.service.list(getUserId(req), req.params.id as string, filter);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.create(getUserId(req), req.params.id as string, req.body);
      const response: ApiResponse<null> = { success: true, data: null };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.remove(getUserId(req), req.params.id as string, req.params.commentId as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  resolve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.setResolved(getUserId(req), req.params.id as string, req.params.commentId as string, req.body.resolved);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  helpful = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.markHelpful(getUserId(req), req.params.id as string, req.params.commentId as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
