import { type Router as RouterType, Router } from 'express';

import { InviteController } from '../controllers/invite.controller.js';
import { GroupInviteService } from '../services/group-invite.service.js';

const router: RouterType = Router();
const controller = new InviteController(new GroupInviteService());

router.get('/', controller.listPending);
router.post('/:id/accept', controller.accept);
router.post('/:id/decline', controller.decline);

export { router as inviteRouter };
