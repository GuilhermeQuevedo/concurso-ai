import type { Request, Response, NextFunction } from 'express';
import type { EditalMapService } from '../services/edital-map.service.js';
import type { ApiResponse } from '@concurso-ai/types';
import { getUserId } from '../utils/request.js';
import { AppError } from '../middlewares/error-handler.js';

export class EditalMapController {
  constructor(private readonly service: EditalMapService) {}

  mapEdital = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const file = req.file;
      if (!file) {
        throw new AppError(400, 'FILE_REQUIRED', 'Envio do PDF do edital é obrigatório.');
      }

      const editalName = req.body.editalName;
      if (!editalName || !editalName.trim()) {
        throw new AppError(400, 'NAME_REQUIRED', 'Nome do concurso/edital é obrigatório.');
      }

      const saveToDb = req.body.saveToDb === 'true' || req.body.saveToDb === true;

      const result = await this.service.mapEdital(userId, file.path, editalName.trim(), saveToDb);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  analyzeProbabilities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const { editalMapId, topicsTree, banca } = req.body;

      if (!editalMapId || !topicsTree || !banca) {
        throw new AppError(400, 'INVALID_PAYLOAD', 'editalMapId, topicsTree e banca são obrigatórios.');
      }

      const result = await this.service.analyzeProbabilities(userId, editalMapId, topicsTree, banca);

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
      const result = await this.service.listEditais(userId);
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
      const result = await this.service.getEdital(id, userId);
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
      const result = await this.service.saveEdital(userId, req.body);
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
      const { editalName } = req.body;
      if (!editalName || !editalName.trim()) {
        throw new AppError(400, 'NAME_REQUIRED', 'Nome é obrigatório');
      }
      const result = await this.service.updateName(id, userId, editalName.trim());
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
      await this.service.deleteEdital(id, userId);
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
