import { type Router as RouterType, Router } from 'express';
import { FlashcardService } from '../services/flashcard.service.js';
import { FlashcardController } from '../controllers/flashcard.controller.js';
import { FlashcardDeckService } from '../services/flashcard-deck.service.js';
import { FlashcardDeckController } from '../controllers/flashcard-deck.controller.js';
import { validateRequest } from '../middlewares/validate.js';
import {
  createDeckSchema,
  generateDeckSchema,
  updateDeckSchema,
  cardSchema,
  importCardsSchema,
} from '../validators/flashcard-deck.validators.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();

const service = new FlashcardService(createAIProvider());
const controller = new FlashcardController(service);
const decks = new FlashcardDeckController(new FlashcardDeckService(createAIProvider()));

router.get('/decks', authMiddleware, decks.list);
router.post('/decks', authMiddleware, validateRequest(createDeckSchema), decks.create);
router.post('/decks/generate', authMiddleware, validateRequest(generateDeckSchema), decks.generate);
router.patch('/decks/:id', authMiddleware, validateRequest(updateDeckSchema), decks.update);
router.delete('/decks/:id', authMiddleware, decks.remove);
router.get('/decks/:id/cards', authMiddleware, decks.cards);
router.post('/decks/:id/cards', authMiddleware, validateRequest(cardSchema), decks.addCard);
router.post('/decks/:id/import', authMiddleware, validateRequest(importCardsSchema), decks.importCards);
router.get('/decks/:id/study', authMiddleware, decks.study);
router.patch('/cards/:id', authMiddleware, validateRequest(cardSchema), decks.updateCard);

router.post('/', authMiddleware, controller.create);
router.post('/generate', authMiddleware, controller.generate);
router.post('/import', authMiddleware, controller.import);
router.get('/due', authMiddleware, controller.getDue);
router.get('/stats', authMiddleware, controller.getStats);
router.get('/', authMiddleware, controller.list);
router.patch('/:id/review', authMiddleware, controller.review);
router.patch('/:id/elaboration', authMiddleware, controller.elaborate);
router.delete('/:id', authMiddleware, controller.delete);

export { router as flashcardRouter };
