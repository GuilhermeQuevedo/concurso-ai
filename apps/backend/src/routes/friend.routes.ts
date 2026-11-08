import { type Router as RouterType, Router } from 'express';
import { z } from 'zod';

import { FriendController } from '../controllers/friend.controller.js';
import { inviteRateLimiter } from '../middlewares/rate-limit.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { FriendService } from '../services/friend.service.js';

const requestSchema = z.object({
  body: z.object({ identifier: z.string().trim().min(3).max(20) }),
});

const router: RouterType = Router();
const controller = new FriendController(new FriendService());

router.get('/', controller.overview);
router.get('/code', controller.getCode);
router.post('/code/regenerate', inviteRateLimiter, controller.regenerateCode);
router.post('/requests', inviteRateLimiter, validateRequest(requestSchema), controller.request);
router.post('/requests/:id/accept', controller.accept);
router.post('/requests/:id/decline', controller.decline);
router.delete('/requests/:id', controller.cancel);
router.delete('/:id', controller.remove);

export { router as friendRouter };
