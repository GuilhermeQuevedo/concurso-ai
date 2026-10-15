import { type Router as RouterType, Router } from 'express';
import { RankingService } from '../services/ranking.service.js';
import { RankingController } from '../controllers/ranking.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import { suggestRankingSchema } from '../validators/ranking.validators.js';

const router: RouterType = Router();

const service = new RankingService();
const controller = new RankingController(service);

router.get('/', authMiddleware, controller.listApproved);
router.post('/suggest', authMiddleware, validateRequest(suggestRankingSchema), controller.suggest);
router.get('/pending', authMiddleware, requireAdmin, controller.listPending);
router.get('/:id/leaderboard', authMiddleware, controller.leaderboard);
router.post('/:id/join', authMiddleware, controller.join);
router.delete('/:id/join', authMiddleware, controller.leave);
router.post('/:id/approve', authMiddleware, requireAdmin, controller.approve);
router.post('/:id/reject', authMiddleware, requireAdmin, controller.reject);
router.delete('/:id', authMiddleware, requireAdmin, controller.remove);

export { router as rankingRouter };
