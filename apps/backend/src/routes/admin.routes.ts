import { type Router as RouterType, Router } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AdminAccessService } from '../services/admin-access.service.js';
import { AdminController } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { grantAccessSchema, revokeAccessSchema } from '../validators/admin.validators.js';

const router: RouterType = Router();

const service = new AdminService();
const controller = new AdminController(service, new AdminAccessService());

router.use(authMiddleware, requireAdmin);
router.get('/overview', controller.overview);
router.get('/users', controller.users);
router.get('/contacts', controller.listContacts);
router.post('/contacts/import', controller.importContacts);
router.delete('/contacts/:id', controller.deleteContact);
router.get('/access', controller.listAccess);
router.post('/access', validateRequest(grantAccessSchema), controller.grantAccess);
router.post('/access/revoke', validateRequest(revokeAccessSchema), controller.revokeAccess);

export { router as adminRouter };
