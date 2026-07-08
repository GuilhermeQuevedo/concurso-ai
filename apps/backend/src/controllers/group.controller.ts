import type { Request, Response, NextFunction } from 'express';
import type { GroupService } from '../services/group.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';

export class GroupController {
  constructor(private readonly service: GroupService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const group = await this.service.create(getUserId(req), req.body);
      const response: ApiResponse<typeof group> = { success: true, data: group };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  join = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const group = await this.service.join(getUserId(req), req.body.code);
      const response: ApiResponse<typeof group> = { success: true, data: group };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  listMyGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const groups = await this.service.listMyGroups(getUserId(req));
      const response: ApiResponse<typeof groups> = { success: true, data: groups };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const group = await this.service.getById(getUserId(req), req.params.id as string);
      const response: ApiResponse<typeof group> = { success: true, data: group };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getRanking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ranking = await this.service.getRanking(getUserId(req), req.params.id as string);
      const response: ApiResponse<typeof ranking> = { success: true, data: ranking };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const feed = await this.service.getFeed(getUserId(req), req.params.id as string);
      const response: ApiResponse<typeof feed> = { success: true, data: feed };
      res.json(response);
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
}
