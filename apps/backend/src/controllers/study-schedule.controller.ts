import type { Request, Response, NextFunction } from 'express';
import type { StudyScheduleService, GenerateScheduleDTO } from '../services/study-schedule.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';
import { AppError } from '../middlewares/error-handler.js';

export class StudyScheduleController {
  constructor(private readonly service: StudyScheduleService) {}

  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const file = req.file;

      const examDate = req.body.examDate;
      const dailyHours = Number(req.body.dailyHours || 3);
      let subjects = req.body.subjects;

      if (typeof subjects === 'string') {
        try {
          subjects = JSON.parse(subjects);
        } catch {
          subjects = subjects.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      if (!Array.isArray(subjects)) {
        subjects = [];
      }

      if (!examDate) {
        throw new AppError(400, 'EXAM_DATE_REQUIRED', 'Data da prova é obrigatória.');
      }

      if (subjects.length === 0 && !file) {
        throw new AppError(400, 'SUBJECTS_OR_FILE_REQUIRED', 'Insira pelo menos uma matéria ou anexe o edital em PDF.');
      }

      const dto: GenerateScheduleDTO = {
        examDate,
        dailyHours,
        subjects,
        userObservations: req.body.userObservations,
        forceRefresh: req.body.forceRefresh === 'true' || req.body.forceRefresh === true,
        saveToDb: req.body.saveToDb === 'true' || req.body.saveToDb === true,
      };

      const result = await this.service.generateSchedule(userId, dto, file?.path);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const result = await this.service.listSchedules(userId);
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const result = await this.service.getSchedule(id, userId);
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  save = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const result = await this.service.saveSchedule(userId, req.body);
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  };

  updateName = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const { title } = req.body;
      if (!title || !title.trim()) {
        throw new AppError(400, 'TITLE_REQUIRED', 'Título é obrigatório');
      }
      const result = await this.service.updateName(id, userId, title.trim());
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  toggleDayCompletion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const { weekIndex, dayIndex } = req.body;
      if (weekIndex === undefined || dayIndex === undefined) {
        throw new AppError(400, 'INDICES_REQUIRED', 'weekIndex e dayIndex são obrigatórios');
      }
      const result = await this.service.toggleDayCompletion(id, userId, Number(weekIndex), Number(dayIndex));
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      await this.service.deleteSchedule(id, userId);
      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}
