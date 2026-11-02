import { Router } from 'express';
import { EditalMapService } from '../services/edital-map.service.js';
import { EditalMapController } from '../controllers/edital-map.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { editalUpload } from '../middlewares/upload.js';
import { createAIProvider } from '../providers/ai.factory.js';

export function createEditalMapRouter(): Router {
  const router = Router();
  const aiProvider = createAIProvider();
  const service = new EditalMapService(aiProvider);
  const controller = new EditalMapController(service);

  router.use(authMiddleware);

  router.post('/map', editalUpload.single('file'), controller.mapEdital);
  router.post('/analyze-probabilities', controller.analyzeProbabilities);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.save);
  router.patch('/:id/name', controller.updateName);
  router.delete('/:id', controller.delete);

  return router;
}
