import { type Router as RouterType, Router } from 'express';
import { ContestService } from '../services/contest.service.js';
import { ContestController } from '../controllers/contest.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { upload } from '../middlewares/upload.js';
import {
  createContestSchema,
  updateContestSchema,
  updateSyllabusItemSchema,
} from '../validators/contest.validators.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();

const aiProvider = createAIProvider();
const service = new ContestService(aiProvider);
const controller = new ContestController(service);

router.post('/', authMiddleware, validateRequest(createContestSchema), controller.create);
router.post('/from-edital', authMiddleware, upload.single('file'), controller.createFromEdital);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.getById);
router.patch('/:id', authMiddleware, validateRequest(updateContestSchema), controller.update);
router.delete('/:id', authMiddleware, controller.delete);
router.patch(
  '/syllabus/:itemId',
  authMiddleware,
  validateRequest(updateSyllabusItemSchema),
  controller.updateSyllabusItem,
);

export { router as contestRouter };
