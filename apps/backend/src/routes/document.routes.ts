import { type Router as RouterType, Router } from 'express';
import { DocumentService } from '../services/document.service.js';
import { DocumentProcessService } from '../services/document-process.service.js';
import { DocumentController } from '../controllers/document.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { upload } from '../middlewares/upload.js';
import { updateDocumentKindSchema } from '../validators/document.validators.js';
import { createAIProvider } from '../providers/ai.factory.js';

const router: RouterType = Router();

const service = new DocumentService();
const processService = new DocumentProcessService(createAIProvider());
const controller = new DocumentController(service, processService);

router.post('/', authMiddleware, upload.single('file'), controller.upload);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.getById);
router.patch('/:id/kind', authMiddleware, validateRequest(updateDocumentKindSchema), controller.updateKind);
router.post('/:id/process', authMiddleware, controller.process);
router.delete('/:id', authMiddleware, controller.delete);

export { router as documentRouter };
