import { type Router as RouterType, Router } from 'express';
import { ErrorNotebookService } from '../services/error-notebook.service.js';
import { ErrorNotebookController } from '../controllers/error-notebook.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();
const service = new ErrorNotebookService(createAIProvider());
const controller = new ErrorNotebookController(service);

router.get('/pending', authMiddleware, controller.listPending);
router.post('/learned/:questionId', authMiddleware, controller.markLearned);
router.post('/remediate', authMiddleware, controller.generateRemediation);

export { router as errorNotebookRouter };
