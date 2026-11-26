import { Router, type Router as RouterType } from 'express';
import { curationController } from '../controllers/curation.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';

export const curationRoutes: RouterType = Router();

// Todas as rotas de curadoria exigem autenticação e perfil ADMIN
curationRoutes.use(authMiddleware, requireAdmin);

curationRoutes.post('/generate', curationController.generate);
curationRoutes.get('/relations', curationController.list);
curationRoutes.post('/relations/:id/approve', curationController.approve);
curationRoutes.post('/relations/:id/reject', curationController.reject);
curationRoutes.patch('/relations/:id', curationController.update);
