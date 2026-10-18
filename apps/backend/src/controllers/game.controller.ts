import type { Request, Response, NextFunction } from 'express';

import type { ApiResponse } from '@concurso-ai/types';
import type { GameService } from '../services/game.service.js';
import { getUserId } from '../utils/request.js';

export class GameController {
  constructor(private readonly service: GameService) {}

  private respond = <T>(res: Response, data: T, status = 200) => {
    const response: ApiResponse<T> = { success: true, data };
    res.status(status).json(response);
  };

  overview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.respond(res, await this.service.overview(getUserId(req)));
    } catch (error) {
      next(error);
    }
  };

  trilha = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.respond(res, await this.service.trilhaMap(getUserId(req)));
    } catch (error) {
      next(error);
    }
  };

  start = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { game, subjectId } = req.body;
      this.respond(res, await this.service.start(getUserId(req), game, subjectId), 201);
    } catch (error) {
      next(error);
    }
  };

  check = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { itemId, choice } = req.body;
      this.respond(res, await this.service.check(getUserId(req), req.params.id as string, itemId, choice));
    } catch (error) {
      next(error);
    }
  };

  finish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.respond(res, await this.service.finish(getUserId(req), req.params.id as string, req.body.answers));
    } catch (error) {
      next(error);
    }
  };
}
