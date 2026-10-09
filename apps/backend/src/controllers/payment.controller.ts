import type { Request, Response, NextFunction } from 'express';
import type { PaymentService } from '../services/payment.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';
import { getUserId } from '../utils/request.js';
import { verifyKiwifySignature } from '../utils/kiwify-signature.js';

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  kiwifyWebhook = async (req: Request, res: Response) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));

    if (env.KIWIFY_WEBHOOK_TOKEN) {
      const signature = (req.query.signature as string | undefined) ?? (req.headers['x-kiwify-signature'] as string | undefined);
      if (!verifyKiwifySignature(raw, signature, env.KIWIFY_WEBHOOK_TOKEN)) {
        return res.status(401).json({ success: false, error: { message: 'Assinatura inválida', code: 'INVALID_SIGNATURE' } });
      }
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(raw.toString('utf8'));
    } catch {
      payload = {};
    }

    const result = await this.service.handleKiwifyWebhook(payload);
    console.log('[kiwify-webhook]', JSON.stringify(result));
    return res.status(200).json({ success: true, data: result });
  };

  myAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: getUserId(req) },
        select: { email: true },
      });
      const access = await this.service.getAccess(user?.email ?? '');
      const response: ApiResponse<typeof access> = { success: true, data: access };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
