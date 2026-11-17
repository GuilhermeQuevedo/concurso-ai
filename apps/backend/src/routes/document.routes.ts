import { type Router as RouterType, Router } from 'express';
import { DocumentService } from '../services/document.service.js';
import { DocumentProcessService } from '../services/document-process.service.js';
import { DocumentJobService } from '../services/document-job.service.js';
import { EditalContinuationService } from '../services/edital-continuation.service.js';
import { DocumentController } from '../controllers/document.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { upload } from '../middlewares/upload.js';
import { updateDocumentKindSchema, updateDocumentNameSchema } from '../validators/document.validators.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();

const service = new DocumentService();
const aiProvider = createAIProvider();
export const documentJobs = new DocumentJobService(new DocumentProcessService(aiProvider), new EditalContinuationService(aiProvider));
const controller = new DocumentController(service, documentJobs);

router.post('/', authMiddleware, upload.single('file'), controller.upload);
router.get('/', authMiddleware, controller.list);
router.get('/jobs/:jobId', authMiddleware, controller.getJob);
router.post('/jobs/:jobId/cancel', authMiddleware, controller.cancelJob);
router.get('/jobs/contest/:contestId', authMiddleware, controller.contestJob);
router.get('/:id', authMiddleware, controller.getById);
router.patch('/:id/kind', authMiddleware, validateRequest(updateDocumentKindSchema), controller.updateKind);
router.patch('/:id/name', authMiddleware, validateRequest(updateDocumentNameSchema), controller.updateName);
router.post('/:id/process', authMiddleware, controller.process);
router.delete('/:id', authMiddleware, controller.delete);

export { router as documentRouter };
