import { type Router as RouterType, Router } from 'express';
import { GroupService } from '../services/group.service.js';
import { GroupController } from '../controllers/group.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: RouterType = Router();

const service = new GroupService();
const controller = new GroupController(service);

router.post('/', authMiddleware, controller.create);
router.post('/join', authMiddleware, controller.join);
router.get('/', authMiddleware, controller.listMyGroups);
router.get('/:id', authMiddleware, controller.getById);
router.get('/:id/ranking', authMiddleware, controller.getRanking);
router.get('/:id/feed', authMiddleware, controller.getFeed);
router.delete('/:id/leave', authMiddleware, controller.leave);

export { router as groupRouter };
