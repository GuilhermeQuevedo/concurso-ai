import type { Request, Response, NextFunction } from 'express';
import { MapService } from '../services/map.service.js';
import { getUserId } from '../utils/request.js';
import { AppError } from '../middlewares/error-handler.js';
import { env } from '../config/env.js';
import type { ApiResponse } from '@concurso-ai/types';
import type { GraphResponseDTO, OverlayResponseDTO, TopicFocusDTO } from '../dtos/map.dtos.js';

export class MapController {
  constructor(private readonly mapService: MapService) {}

  private checkFeatureFlag(): void {
    // Se a feature flag estiver desligada e não estiver em ambiente de teste, bloqueia acesso
    if (!env.FEATURE_REVIEW_MAP && env.NODE_ENV !== 'test') {
      throw new AppError(404, 'FEATURE_DISABLED', 'O Mapa de Revisão não está habilitado neste ambiente.');
    }
  }

  /**
   * GET /api/map/graph
   * Grafo canônico compartilhado com suporte a ETag e cache HTTP público.
   */
  getGraph = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.checkFeatureFlag();

      const { data, eTag } = await this.mapService.getGraph(req.query);

      // Tratamento de cache 304 Not Modified
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && ifNoneMatch === eTag) {
        res.status(304).end();
        return;
      }

      res.setHeader('ETag', eTag);
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

      const response: ApiResponse<GraphResponseDTO> = {
        success: true,
        data,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/map/overlay
   * Overlay privado do aluno autenticado (domínio, estado, prioridade e flashcards vencidos).
   */
  getOverlay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.checkFeatureFlag();
      const userId = getUserId(req);

      const overlay = await this.mapService.getOverlay(userId, req.query);

      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      const response: ApiResponse<OverlayResponseDTO> = {
        success: true,
        data: overlay,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/map/topics/:id/focus
   * Conteúdo em foco com satélites (flashcards vencidos, erros recentes e nós vizinhos).
   */
  getFocus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.checkFeatureFlag();
      const userId = getUserId(req);
      const rawTopicId = req.params.id;
      const topicId = Array.isArray(rawTopicId) ? rawTopicId[0] : rawTopicId;

      if (!topicId) {
        throw new AppError(400, 'PARAM_REQUIRED', 'ID do tópico é obrigatório.');
      }

      const focusData = await this.mapService.getFocus(userId, topicId, req.query);

      res.setHeader('Cache-Control', 'private, no-cache');

      const response: ApiResponse<TopicFocusDTO> = {
        success: true,
        data: focusData,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}
