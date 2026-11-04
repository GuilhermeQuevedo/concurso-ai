import type { Request, Response, NextFunction } from 'express';
import type { PaymentService } from '../services/payment.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';
import { getUserId } from '../utils/request.js';
import { isVipEmail } from '../utils/security.js';

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  myAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: getUserId(req) },
        select: { email: true, role: true },
      });

      if (user?.role === 'ADMIN' || (user?.email && isVipEmail(user.email))) {
        const data = {
          active: true,
          enforced: env.REQUIRE_SUBSCRIPTION,
          status: 'ADMIN',
          expiresAt: null,
        };
        const response: ApiResponse<typeof data> = { success: true, data };
        return res.json(response);
      }

      const access = await this.service.getAccess(user?.email ?? '');
      const response: ApiResponse<typeof access> = { success: true, data: access };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
