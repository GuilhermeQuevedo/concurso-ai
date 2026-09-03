import { type Router as RouterType, Router } from 'express';
import { EssayService } from '../services/essay.service.js';
import { EssayController } from '../controllers/essay.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { essayUpload } from '../middlewares/essay-upload.js';
import { validateRequest } from '../middlewares/validate.js';
import { submitEssaySchema } from '../validators/essay.validators.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();

const aiProvider = createAIProvider();
const service = new EssayService(aiProvider);
const controller = new EssayController(service);

router.post('/', authMiddleware, essayUpload.single('file'), validateRequest(submitEssaySchema), controller.submit);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.getById);
router.delete('/:id', authMiddleware, controller.delete);

export { router as essayRouter };
