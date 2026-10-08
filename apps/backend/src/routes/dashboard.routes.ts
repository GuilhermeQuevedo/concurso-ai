import { type Router as RouterType, Router } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { setDailyGoalSchema } from '../validators/dashboard.validators.js';

const router: RouterType = Router();

const service = new DashboardService();
const controller = new DashboardController(service);

router.get('/', authMiddleware, controller.getSummary);
router.patch('/daily-goal', authMiddleware, validateRequest(setDailyGoalSchema), controller.setDailyGoal);

export { router as dashboardRouter };
