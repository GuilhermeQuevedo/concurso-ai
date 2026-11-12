import { Router, type Router as RouterType } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AdminAccessService } from '../services/admin-access.service.js';
import { AdminController } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { grantAccessSchema, revokeAccessSchema } from '../validators/admin.validators.js';
import { auditContextMiddleware } from '../middlewares/audit-context.middleware.js';

const router: RouterType = Router();

const service = new AdminService();
const controller = new AdminController(service, new AdminAccessService());

// Todas as rotas administrativas requerem autenticação, role ADMIN e enriquecimento de contexto de auditoria
router.use(authMiddleware, requireAdmin, auditContextMiddleware);

router.get('/overview', controller.overview);
router.get('/users', controller.users);
router.post('/users/:id/reveal', controller.revealUser);
router.get('/contacts', controller.listContacts);
router.post('/contacts/import', controller.importContacts);
router.post('/contacts/opt-out', controller.optOutContact);
router.post('/contacts/:id/reveal', controller.revealContact);
router.delete('/contacts/:id', controller.deleteContact);
router.get('/access', controller.listAccess);
router.post('/access', validateRequest(grantAccessSchema), controller.grantAccess);
router.post('/access/revoke', validateRequest(revokeAccessSchema), controller.revokeAccess);
router.get('/audit-logs', controller.listAuditLogs);

export { router as adminRouter };
