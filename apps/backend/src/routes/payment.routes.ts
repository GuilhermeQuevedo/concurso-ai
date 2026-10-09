import { type Router as RouterType, Router, raw } from 'express';
import { PaymentService } from '../services/payment.service.js';
import { PaymentController } from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: RouterType = Router();

const service = new PaymentService();
const controller = new PaymentController(service);

// Webhook público (corpo cru para validar a assinatura HMAC)
router.post('/kiwify/webhook', raw({ type: '*/*' }), controller.kiwifyWebhook);

router.get('/me', authMiddleware, controller.myAccess);

export { router as paymentRouter };
