import { Router, type Router as RouterType } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AdminAccessService } from '../services/admin-access.service.js';
import { AdminController } from '../controllers/admin.controller.js';
import { publicRateLimiter } from '../middlewares/rate-limit.middleware.js';

const router: RouterType = Router();
const service = new AdminService();
const controller = new AdminController(service, new AdminAccessService());

// Rota pública de opt-out/descadastro para destinatários de comunicação (LGPD Art. 18, IX)
router.post('/opt-out', publicRateLimiter, controller.optOutContact);

export { router as contactRouter };
