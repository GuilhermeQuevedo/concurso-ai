import { type Router as RouterType, Router } from 'express';
import { SubjectRepository } from '../repositories/subject.repository.js';
import { SubjectService } from '../services/subject.service.js';
import { SubjectController } from '../controllers/subject.controller.js';
import { validateRequest } from '../middlewares/validate.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  createSubjectSchema,
  updateSubjectSchema,
  subjectParamsSchema,
} from '../validators/subject.validators.js';

const router: RouterType = Router();

const repository = new SubjectRepository();
const service = new SubjectService(repository);
const controller = new SubjectController(service);

router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, validateRequest(subjectParamsSchema), controller.getById);
router.post('/', authMiddleware, validateRequest(createSubjectSchema), controller.create);
router.put('/:id', authMiddleware, validateRequest(updateSubjectSchema), controller.update);
router.delete('/:id', authMiddleware, validateRequest(subjectParamsSchema), controller.delete);

export { router as subjectRouter };
