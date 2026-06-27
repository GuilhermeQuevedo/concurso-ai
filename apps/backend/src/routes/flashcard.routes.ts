import { type Router as RouterType, Router } from 'express';
import { FlashcardService } from '../services/flashcard.service.js';
import { FlashcardController } from '../controllers/flashcard.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: RouterType = Router();

const service = new FlashcardService();
const controller = new FlashcardController(service);

router.post('/', authMiddleware, controller.create);
router.get('/due', authMiddleware, controller.getDue);
router.get('/stats', authMiddleware, controller.getStats);
router.get('/', authMiddleware, controller.list);
router.patch('/:id/review', authMiddleware, controller.review);
router.delete('/:id', authMiddleware, controller.delete);

export { router as flashcardRouter };
