import { type Router as RouterType, Router } from 'express';
import { StudyTaskService } from '../services/study-task.service.js';
import { StudyTaskController } from '../controllers/study-task.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import {
  generatePlanSchema,
  listTasksSchema,
  updateTaskSchema,
} from '../validators/study-task.validators.js';

const router: RouterType = Router();

const service = new StudyTaskService();
const controller = new StudyTaskController(service);

router.post('/generate', authMiddleware, validateRequest(generatePlanSchema), controller.generatePlan);
router.get('/', authMiddleware, validateRequest(listTasksSchema), controller.list);
router.get('/today', authMiddleware, controller.today);
router.patch('/:id', authMiddleware, validateRequest(updateTaskSchema), controller.update);
router.delete('/contest/:contestId', authMiddleware, controller.clearPlan);

export { router as studyTaskRouter };
