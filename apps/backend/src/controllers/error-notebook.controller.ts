import type { Request, Response, NextFunction } from 'express';
import { ErrorNotebookService } from '../services/error-notebook.service.js';
import { getUserId } from '../utils/request.js';

export class ErrorNotebookController {
  constructor(private readonly service: ErrorNotebookService) {}

  listPending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const errors = await this.service.listPendingErrors(userId);
      res.json({ success: true, data: errors });
    } catch (error) {
      next(error);
    }
  };

  markLearned = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const questionId = req.params.questionId as string;
      const result = await this.service.markAsLearned(userId, questionId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  generateRemediation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const result = await this.service.generateRemediationCards(userId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
