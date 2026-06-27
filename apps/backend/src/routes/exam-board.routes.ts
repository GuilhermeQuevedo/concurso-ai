import { type Router as RouterType, Router } from 'express';
import { ExamBoardRepository } from '../repositories/exam-board.repository.js';
import { ExamBoardService } from '../services/exam-board.service.js';
import { ExamBoardController } from '../controllers/exam-board.controller.js';
import { validateRequest } from '../middlewares/validate.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  createExamBoardSchema,
  updateExamBoardSchema,
  examBoardParamsSchema,
} from '../validators/exam-board.validators.js';

const router: RouterType = Router();

const repository = new ExamBoardRepository();
const service = new ExamBoardService(repository);
const controller = new ExamBoardController(service);

router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, validateRequest(examBoardParamsSchema), controller.getById);
router.post('/', authMiddleware, validateRequest(createExamBoardSchema), controller.create);
router.put('/:id', authMiddleware, validateRequest(updateExamBoardSchema), controller.update);
router.delete('/:id', authMiddleware, validateRequest(examBoardParamsSchema), controller.delete);

export { router as examBoardRouter };
