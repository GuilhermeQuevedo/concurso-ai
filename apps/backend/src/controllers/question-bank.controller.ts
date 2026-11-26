import type { NextFunction, Request, Response } from 'express';

import type { ApiResponse } from '@concurso-ai/types';

import type { QuestionBankService } from '../services/question-bank.service.js';
import { getUserId } from '../utils/request.js';
import { bankFiltersQuerySchema } from '../validators/question-bank.validators.js';

export class QuestionBankController {
  constructor(private readonly service: QuestionBankService) {}

  facets = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.facets();
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  count = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const total = await this.service.count(bankFiltersQuerySchema.parse(req.query));
      const response: ApiResponse<{ total: number }> = { success: true, data: { total } };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  buildSet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const set = await this.service.buildSet(getUserId(req), req.body);
      const response: ApiResponse<typeof set> = { success: true, data: set };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
