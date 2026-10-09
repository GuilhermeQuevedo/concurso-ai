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
router.get('/contacts', controller.listContacts);
router.post('/contacts/import', controller.importContacts);
router.delete('/contacts/:id', controller.deleteContact);

export { router as adminRouter };
