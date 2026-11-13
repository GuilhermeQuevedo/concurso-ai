import { Router } from 'express';
import { StudyScheduleService } from '../services/study-schedule.service.js';
import { StudyScheduleController } from '../controllers/study-schedule.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { editalUpload } from '../middlewares/upload.js';
import { createAIProvider } from '../providers/ai.factory.js';
import { StudyScheduleLayoutService } from '../services/study-schedule-layout.service.js';
import { StudyScheduleLayoutController } from '../controllers/study-schedule-layout.controller.js';
import { heavyRateLimiter } from '../middlewares/rate-limit.middleware.js';

export function createStudyScheduleRouter(): Router {
  const router = Router();
  const aiProvider = createAIProvider();
  const service = new StudyScheduleService(aiProvider);
  const controller = new StudyScheduleController(service);
  const layoutController = new StudyScheduleLayoutController(new StudyScheduleLayoutService());

  router.use(authMiddleware);

  router.post('/generate', heavyRateLimiter, editalUpload.single('file'), controller.generate);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.save);
  router.patch('/:id/name', controller.updateName);
  router.patch('/:id/toggle-day', controller.toggleDayCompletion);
  router.put('/:id/weeks', layoutController.replaceWeeks);
  router.delete('/:id', controller.delete);

  return router;
}
