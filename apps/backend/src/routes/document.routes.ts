import { type Router as RouterType, Router } from 'express';
import { DocumentService } from '../services/document.service.js';
import { DocumentController } from '../controllers/document.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.js';

const router: RouterType = Router();

const service = new DocumentService();
const controller = new DocumentController(service);

router.post('/', authMiddleware, upload.single('file'), controller.upload);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.getById);
router.delete('/:id', authMiddleware, controller.delete);

export { router as documentRouter };
