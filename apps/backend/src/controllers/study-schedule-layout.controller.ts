import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import { reorganizeScheduleSchema } from '../dto/schedule-reorganize.dto.js';
import { AppError } from '../middlewares/error-handler.js';
import type { StudyScheduleLayoutService } from '../services/study-schedule-layout.service.js';
import { getUserId } from '../utils/request.js';

export class StudyScheduleLayoutController {
  constructor(private readonly service: StudyScheduleLayoutService) {}

  replaceWeeks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = reorganizeScheduleSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError(400, 'INVALID_SCHEDULE', 'Cronograma reorganizado inválido.');
      const result = await this.service.replaceWeeks(String(req.params.id), getUserId(req), parsed.data);
      const response: ApiResponse<typeof result> = { success: true, data: result };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
