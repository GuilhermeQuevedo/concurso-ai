import { type Router as RouterType, Router } from 'express';
import { QuestionSetService } from '../services/question-set.service.js';
import { QuestionSetController } from '../controllers/question-set.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import {
  generateQuestionSetSchema,
  createManualSetSchema,
} from '../validators/question-set.validators.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();

const service = new QuestionSetService(createAIProvider());
const controller = new QuestionSetController(service);

router.get('/', authMiddleware, controller.list);
router.post('/generate', authMiddleware, validateRequest(generateQuestionSetSchema), controller.generate);
router.post('/manual', authMiddleware, validateRequest(createManualSetSchema), controller.createManual);
router.get('/:id', authMiddleware, controller.getById);
router.delete('/:id', authMiddleware, controller.remove);

export { router as questionSetRouter };
