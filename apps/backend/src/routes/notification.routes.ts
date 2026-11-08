import { type Router as RouterType, Router } from 'express';

import { NotificationController } from '../controllers/notification.controller.js';
import { NotificationService } from '../services/notification.service.js';

const router: RouterType = Router();
const controller = new NotificationController(new NotificationService());

router.get('/', controller.list);
router.post('/read-all', controller.markAllRead);
router.post('/:id/read', controller.markRead);

export { router as notificationRouter };
