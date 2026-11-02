import { Router } from 'express';
import { StudyScheduleService } from '../services/study-schedule.service.js';
import { StudyScheduleController } from '../controllers/study-schedule.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { editalUpload } from '../middlewares/upload.js';
import { createAIProvider } from '../providers/ai.factory.js';

export function createStudyScheduleRouter(): Router {
  const router = Router();
  const aiProvider = createAIProvider();
  const service = new StudyScheduleService(aiProvider);
  const controller = new StudyScheduleController(service);

  router.use(authMiddleware);

  router.post('/generate', editalUpload.single('file'), controller.generate);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.save);
  router.patch('/:id/name', controller.updateName);
  router.patch('/:id/toggle-day', controller.toggleDayCompletion);
  router.delete('/:id', controller.delete);

  return router;
}
