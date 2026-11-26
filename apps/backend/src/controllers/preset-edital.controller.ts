import type { NextFunction, Request, Response } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import type { PresetEditalService } from '../services/preset-edital.service.js';
import { getUserId } from '../utils/request.js';

export class PresetEditalController {
  constructor(private readonly service: PresetEditalService) {}

  list = (_req: Request, res: Response) => {
    const data = this.service.list();
    const response: ApiResponse<typeof data> = { success: true, data };
    res.json(response);
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { catalogId, cargoId } = req.body as { catalogId: string; cargoId: string };
      const contest = await this.service.createContest(getUserId(req), catalogId, cargoId);
      const response: ApiResponse<typeof contest> = { success: true, data: contest };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
