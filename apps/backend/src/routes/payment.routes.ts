import { type Router as RouterType, Router, raw } from 'express';
import { PaymentService } from '../services/payment.service.js';
import { PaymentController } from '../controllers/payment.controller.js';
import { StripeController } from '../controllers/stripe.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { createCheckoutSessionSchema } from '../validators/stripe.validators.js';

const router: RouterType = Router();

const service = new PaymentService();
const controller = new PaymentController(service);
const stripeController = new StripeController();

// Kiwify Webhook
router.post('/kiwify/webhook', raw({ type: '*/*' }), controller.kiwifyWebhook);

// Stripe Webhook
router.post('/stripe/webhook', raw({ type: '*/*' }), stripeController.handleWebhook);

// Status de acesso do usuário atual
router.get('/me', authMiddleware, controller.myAccess);

// Stripe Endpoints (config é público para renderizar planos na landing page)
router.get('/stripe/config', stripeController.getConfig);
router.post(
  '/stripe/checkout',
  authMiddleware,
  validateRequest(createCheckoutSessionSchema),
  stripeController.createCheckout,
);
router.post('/stripe/portal', authMiddleware, stripeController.createPortal);
router.get('/stripe/invoices', authMiddleware, stripeController.listInvoices);

export { router as paymentRouter };
