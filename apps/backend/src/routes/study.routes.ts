import { type Router as RouterType, Router } from 'express';
import { StudyService } from '../services/study.service.js';
import { StudyController } from '../controllers/study.controller.js';
import { validateRequest } from '../middlewares/validate.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  createStudySessionSchema,
  submitAnswerSchema,
  finishSessionSchema,
  toggleFavoriteSchema,
} from '../validators/study.validators.js';

const router: RouterType = Router();

const service = new StudyService();
const controller = new StudyController(service);

router.post('/sessions', authMiddleware, validateRequest(createStudySessionSchema), controller.createSession);
router.post('/sessions/:sessionId/answer', authMiddleware, validateRequest(submitAnswerSchema), controller.submitAnswer);
router.post('/sessions/:sessionId/finish', authMiddleware, validateRequest(finishSessionSchema), controller.finishSession);
router.post('/favorites', authMiddleware, validateRequest(toggleFavoriteSchema), controller.toggleFavorite);
router.get('/stats', authMiddleware, controller.getStats);
router.get('/history', authMiddleware, controller.getHistory);

export { router as studyRouter };
