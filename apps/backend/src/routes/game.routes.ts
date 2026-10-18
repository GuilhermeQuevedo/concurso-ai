import { type Router as RouterType, Router } from 'express';

import { GameService } from '../services/game.service.js';
import { GameController } from '../controllers/game.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { startGameSchema, checkAnswerSchema, finishGameSchema } from '../validators/game.validators.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();
const controller = new GameController(new GameService(createAIProvider()));

router.get('/overview', authMiddleware, controller.overview);
router.get('/trilha', authMiddleware, controller.trilha);
router.post('/rounds', authMiddleware, validateRequest(startGameSchema), controller.start);
router.post('/rounds/:id/check', authMiddleware, validateRequest(checkAnswerSchema), controller.check);
router.post('/rounds/:id/finish', authMiddleware, validateRequest(finishGameSchema), controller.finish);

export { router as gameRouter };
