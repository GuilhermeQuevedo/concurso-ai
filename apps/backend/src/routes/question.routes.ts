import { type Router as RouterType, Router } from 'express';
import { QuestionService } from '../services/question.service.js';
import { QuestionController } from '../controllers/question.controller.js';
import { validateRequest } from '../middlewares/validate.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { generateQuestionsSchema } from '../validators/question.validators.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();

const aiProvider = createAIProvider();
const service = new QuestionService(aiProvider);
const controller = new QuestionController(service);

router.post('/generate', authMiddleware, validateRequest(generateQuestionsSchema), controller.generate);
router.post('/slice-exam', authMiddleware, controller.sliceExam);
router.get('/subject/:subjectId', authMiddleware, controller.getBySubject);
router.get('/:id', authMiddleware, controller.getById);

export { router as questionRouter };
