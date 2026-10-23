import type { Request, Response, NextFunction } from 'express';
import { CalendarIntegrationService } from '../services/calendar-integration.service.js';
import { getUserId } from '../utils/request.js';

export class CalendarIntegrationController {
  constructor(private readonly service = new CalendarIntegrationService()) {}

  getIntegration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const data = await this.service.getIntegration(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const data = await this.service.updateSettings(userId, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  regenerateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const data = await this.service.regenerateToken(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawToken = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
      const token = String(rawToken ?? '').replace(/\.ics$/i, '');
      const ics = await this.service.generateIcsFeed(token);

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="engrama-estudos.ics"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(ics);
    } catch (error) {
      next(error);
    }
  };

  getGoogleAuthUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const data = this.service.getGoogleAuthUrl(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  handleGoogleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const { code } = req.body;
      const data = await this.service.handleGoogleCallback(userId, code);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  syncToGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const data = await this.service.syncToGoogle(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  disconnectGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const data = await this.service.disconnectGoogle(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
