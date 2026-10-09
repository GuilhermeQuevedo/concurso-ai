import { type Router as RouterType, Router } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AdminController } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';

const router: RouterType = Router();

const service = new AdminService();
const controller = new AdminController(service);

router.use(authMiddleware, requireAdmin);
router.get('/overview', controller.overview);
router.get('/users', controller.users);

export { router as adminRouter };
