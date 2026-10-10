import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';
import type { StudyKitService } from '../services/study-kit.service.js';
import { generateStudyKitSchema } from '../validators/study-kit.validators.js';
import { AppError } from '../middlewares/error-handler.js';
import { getUserId } from '../utils/request.js';

export class StudyKitController {
  constructor(private readonly service: StudyKitService) {}

  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = generateStudyKitSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Dados inválidos');
      }
      const data = await this.service.generate(getUserId(req), parsed.data);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
