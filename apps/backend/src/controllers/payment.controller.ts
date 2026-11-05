import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

import type { AccessStatus, PaymentService } from '../services/payment.service.js';
import { getUserId } from '../utils/request.js';

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  myAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const access = await this.service.getAccessForUser(getUserId(req));
      const response: ApiResponse<AccessStatus> = { success: true, data: access };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
