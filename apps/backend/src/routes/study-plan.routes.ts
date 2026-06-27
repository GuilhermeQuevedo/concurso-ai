import { type Router as RouterType, Router } from 'express';
import { StudyPlanService } from '../services/study-plan.service.js';
import { StudyPlanController } from '../controllers/study-plan.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: RouterType = Router();

const service = new StudyPlanService();
const controller = new StudyPlanController(service);

router.post('/', authMiddleware, controller.create);
router.get('/active', authMiddleware, controller.getActive);
router.get('/suggest', authMiddleware, controller.suggest);
router.get('/', authMiddleware, controller.list);
router.patch('/items/:itemId/toggle', authMiddleware, controller.toggleItem);
router.delete('/:id', authMiddleware, controller.delete);

export { router as studyPlanRouter };
