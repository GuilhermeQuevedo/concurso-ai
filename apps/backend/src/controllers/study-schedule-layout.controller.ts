import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import type { StudyScheduleLayoutService } from '../services/study-schedule-layout.service.js';
import { getUserId } from '../utils/request.js';

export class StudyScheduleLayoutController {
  constructor(private readonly service: StudyScheduleLayoutService) {}

  replaceWeeks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.replaceWeeks(String(req.params.id), getUserId(req), req.body);
      const response: ApiResponse<typeof result> = { success: true, data: result };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
