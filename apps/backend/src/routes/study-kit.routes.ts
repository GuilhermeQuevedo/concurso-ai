import { type Router as RouterType, Router } from 'express';
import { StudyKitService } from '../services/study-kit.service.js';
import { StudyKitController } from '../controllers/study-kit.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();

const service = new StudyKitService(createAIProvider());
const controller = new StudyKitController(service);

router.post('/generate', authMiddleware, controller.generate);

export { router as studyKitRouter };
