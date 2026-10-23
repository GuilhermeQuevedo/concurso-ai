import type { Request, Response, NextFunction } from 'express';
import { StripeService } from '../services/stripe.service.js';
import { getUserId } from '../utils/request.js';

export class StripeController {
  constructor(private readonly service = new StripeService()) {}

  getConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = this.service.getConfig();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  createCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const data = await this.service.createCheckoutSession(userId, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  createPortal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const data = await this.service.createBillingPortalSession(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  listInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const data = await this.service.listInvoices(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.headers['stripe-signature'] as string | undefined;
      const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody ?? req.body;

      const data = await this.service.handleWebhook(rawBody, signature);
      res.json({ received: true, ...data });
    } catch (error) {
      next(error);
    }
  };
}
