import type { Request, Response, NextFunction } from 'express';
import { relationGeneratorService } from '../services/relation-generator.service.js';
import { getUserId } from '../utils/request.js';
import {
  generateRelationsBodySchema,
  rejectRelationBodySchema,
  updateDraftRelationBodySchema,
  listCurationRelationsQuerySchema,
} from '../validators/relation-generator.validators.js';

export const curationController = {
  /**
   * Dispara a geração de rascunhos de relações semânticas para um tópico via IA.
   */
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedBody = generateRelationsBodySchema.parse(req.body);

      const result = await relationGeneratorService.generateDraftRelations(
        parsedBody.topicId,
        parsedBody.candidateTopicIds,
      );

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lista relações na fila de curadoria administrativa.
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedQuery = listCurationRelationsQuerySchema.parse(req.query);

      const result = await relationGeneratorService.listCurationRelations(parsedQuery);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Aprova uma relação em rascunho, tornando-a pública no grafo de revisão.
   */
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewerId = getUserId(req);
      const rawId = req.params.id;
      const relationId = Array.isArray(rawId) ? rawId[0] : rawId;

      const result = await relationGeneratorService.approveRelation(relationId, reviewerId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Rejeita uma relação candidata com justificativa pedagógica.
   */
  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewerId = getUserId(req);
      const rawId = req.params.id;
      const relationId = Array.isArray(rawId) ? rawId[0] : rawId;
      const parsedBody = rejectRelationBodySchema.parse(req.body);

      const result = await relationGeneratorService.rejectRelation(
        relationId,
        reviewerId,
        parsedBody.rejectionReason,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Atualiza a evidência ou fonte jurídica de uma relação em rascunho antes da aprovação.
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const rawId = req.params.id;
      const relationId = Array.isArray(rawId) ? rawId[0] : rawId;
      const parsedBody = updateDraftRelationBodySchema.parse(req.body);

      const result = await relationGeneratorService.updateDraftRelation(relationId, parsedBody);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
