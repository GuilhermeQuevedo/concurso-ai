import { type Router as RouterType, Router } from 'express';
import { ContestService } from '../services/contest.service.js';
import { ContestReviewService } from '../services/contest-review.service.js';
import { ContestController } from '../controllers/contest.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { upload } from '../middlewares/upload.js';
import {
  createContestSchema,
  updateContestSchema,
  updateSyllabusItemSchema,
  setImportanceSchema,
  completeReviewSchema,
} from '../validators/contest.validators.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();

const aiProvider = createAIProvider();
const service = new ContestService(aiProvider);
const reviewService = new ContestReviewService();
const controller = new ContestController(service, reviewService);

router.post('/', authMiddleware, validateRequest(createContestSchema), controller.create);
router.post('/from-edital', authMiddleware, upload.single('file'), controller.createFromEdital);
router.get('/', authMiddleware, controller.list);
router.get('/reviews/due', authMiddleware, controller.listDueReviews);
router.post(
  '/reviews/:reviewId/complete',
  authMiddleware,
  validateRequest(completeReviewSchema),
  controller.completeReview,
);
router.get('/:id', authMiddleware, controller.getById);
router.patch('/:id', authMiddleware, validateRequest(updateContestSchema), controller.update);
router.patch('/:id/importance', authMiddleware, validateRequest(setImportanceSchema), controller.setImportance);
router.delete('/:id', authMiddleware, controller.delete);
router.patch(
  '/syllabus/:itemId',
  authMiddleware,
  validateRequest(updateSyllabusItemSchema),
  controller.updateSyllabusItem,
);
router.get('/syllabus/:itemId/content', authMiddleware, controller.getTopicContent);

export { router as contestRouter };
