import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import type { GroupInviteService } from '../services/group-invite.service.js';
import { getUserId } from '../utils/request.js';

export class InviteController {
  constructor(private readonly service: GroupInviteService) {}

  invite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.invite(getUserId(req), req.params.id as string, {
        nickname: req.body.nickname,
        friendUserId: req.body.friendUserId,
      });
      const response: ApiResponse<null> = { success: true, data: null };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  listPending = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.listPending(getUserId(req));
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  accept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.accept(getUserId(req), req.params.id as string);
      const response: ApiResponse<typeof data> = { success: true, data };
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
}
