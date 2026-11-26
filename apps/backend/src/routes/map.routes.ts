import { type Router as RouterType, Router } from 'express';
import { MapController } from '../controllers/map.controller.js';
import { mapService } from '../services/map.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { publicRateLimiter, authenticatedRateLimiter } from '../middlewares/rate-limit.middleware.js';
import {
  getGraphQuerySchema,
  getOverlayQuerySchema,
  getFocusParamsSchema,
} from '../validators/map.validators.js';

import { curationRoutes } from './curation.routes.js';

const router: RouterType = Router();
const controller = new MapController(mapService);

/**
 * Rotas administrativas de curadoria de relações de tópicos geradas por IA.
 * Requerem perfil ADMIN.
 */
router.use('/curation', curationRoutes);

/**
 * GET /api/map/graph
 * Nós e arestas aprovadas do grafo canônico compartilhado.
 * Público, com suporte a ETag e cache HTTP.
 */
router.get(
  '/graph',
  publicRateLimiter,
  validateRequest(getGraphQuerySchema),
  controller.getGraph,
);

/**
 * GET /api/map/overlay
 * Overlay pessoal com pontuação de domínio, estado e prioridade.
 * Privado do usuário autenticado.
 */
router.get(
  '/overlay',
  authMiddleware,
  authenticatedRateLimiter,
  validateRequest(getOverlayQuerySchema),
  controller.getOverlay,
);

/**
 * GET /api/map/topics/:id/focus
 * Dados de foco do tópico com satélites de estudo (flashcards vencidos, erros recentes e tópicos conexos).
 * Privado do usuário autenticado.
 */
router.get(
  '/topics/:id/focus',
  authMiddleware,
  authenticatedRateLimiter,
  validateRequest(getFocusParamsSchema),
  controller.getFocus,
);

export { router as mapRouter };
