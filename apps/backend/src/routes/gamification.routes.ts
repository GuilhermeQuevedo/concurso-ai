import { type Router as RouterType, Router } from 'express';
import { GamificationService } from '../services/gamification.service.js';
import { GamificationController } from '../controllers/gamification.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: RouterType = Router();

const service = new GamificationService();
const controller = new GamificationController(service);

router.get('/profile', authMiddleware, controller.getProfile);
router.post('/check', authMiddleware, controller.checkAchievements);

export { router as gamificationRouter };
