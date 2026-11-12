import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import type { FriendService } from '../services/friend.service.js';
import { getUserId } from '../utils/request.js';

export class FriendController {
  constructor(private readonly service: FriendService) {}

  overview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.overview(getUserId(req));
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = { code: await this.service.getCode(getUserId(req)) };
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  regenerateCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = { code: await this.service.regenerateCode(getUserId(req)) };
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  request = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.request(getUserId(req), req.body.identifier);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  accept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.accept(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  decline = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.decline(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.cancel(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.remove(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
