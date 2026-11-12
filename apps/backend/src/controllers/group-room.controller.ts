import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import type { GroupRoomStateService } from '../services/group-room-state.service.js';
import type { GroupRoomService } from '../services/group-room.service.js';
import { getUserId } from '../utils/request.js';

export class GroupRoomController {
  constructor(
    private readonly rooms: GroupRoomService,
    private readonly state: GroupRoomStateService,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.rooms.create(getUserId(req), req.params.id as string, req.body);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.rooms.list(getUserId(req), req.params.id as string);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.state.get(getUserId(req), req.params.id as string, req.params.roomId as string);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  join = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.rooms.join(getUserId(req), req.params.id as string, req.params.roomId as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  start = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.rooms.start(getUserId(req), req.params.id as string, req.params.roomId as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  answer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.rooms.answer(getUserId(req), req.params.id as string, req.params.roomId as string, req.body.questionId, req.body.choice);
      const response: ApiResponse<null> = { success: true, data: null };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
