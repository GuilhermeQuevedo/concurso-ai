import type { Request, Response, NextFunction } from 'express';
import type { ContestService } from '../services/contest.service.js';
import type { ContestReviewService } from '../services/contest-review.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { AppError } from '../middlewares/error-handler.js';
import { getUserId } from '../utils/request.js';

export class ContestController {
  constructor(
    private readonly service: ContestService,
    private readonly reviewService: ContestReviewService,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contest = await this.service.create(getUserId(req), req.body);
      const response: ApiResponse<typeof contest> = { success: true, data: contest };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  createFromEdital = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        throw new AppError(400, 'MISSING_FILE', 'Envie o PDF do edital.');
      }
      const focus = typeof req.body?.focus === 'string' ? req.body.focus : undefined;
      const contest = await this.service.createFromEdital(
        getUserId(req),
        {
          originalname: file.originalname,
          mimetype: file.mimetype,
          path: file.path,
        },
        focus,
      );
      const response: ApiResponse<typeof contest> = { success: true, data: contest };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getTopicContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const content = await this.service.getTopicContent(getUserId(req), req.params.itemId as string);
      const response: ApiResponse<typeof content> = { success: true, data: content };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contests = await this.service.listByUser(getUserId(req));
      const response: ApiResponse<typeof contests> = { success: true, data: contests };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contest = await this.service.getById(getUserId(req), req.params.id as string);
      const response: ApiResponse<typeof contest> = { success: true, data: contest };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contest = await this.service.update(getUserId(req), req.params.id as string, req.body);
      const response: ApiResponse<typeof contest> = { success: true, data: contest };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(getUserId(req), req.params.id as string);
      const response: ApiResponse<null> = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  updateSyllabusItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.service.updateSyllabusItem(
        getUserId(req),
        req.params.itemId as string,
        req.body.studied,
      );
      const response: ApiResponse<typeof item> = { success: true, data: item };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  setImportance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contest = await this.service.setImportance(
        getUserId(req),
        req.params.id as string,
        req.body.discipline,
        req.body.importance,
      );
      const response: ApiResponse<typeof contest> = { success: true, data: contest };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  completeReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await this.reviewService.complete(
        getUserId(req),
        req.params.reviewId as string,
        req.body.completed,
      );
      const response: ApiResponse<typeof review> = { success: true, data: review };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  listDueReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviews = await this.reviewService.listDue(getUserId(req));
      const response: ApiResponse<typeof reviews> = { success: true, data: reviews };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
