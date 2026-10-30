import { type Router as RouterType, Router } from 'express';
import type { ApiResponse } from '@concurso-ai/types';
import { authRouter } from './auth.routes.js';
import { subjectRouter } from './subject.routes.js';
import { examBoardRouter } from './exam-board.routes.js';
import { questionRouter } from './question.routes.js';
import { studyRouter } from './study.routes.js';
import { documentRouter } from './document.routes.js';
import { studyPlanRouter } from './study-plan.routes.js';
import { flashcardRouter } from './flashcard.routes.js';
import { studyKitRouter } from './study-kit.routes.js';
import { gamificationRouter } from './gamification.routes.js';
import { groupRouter } from './group.routes.js';
import { essayRouter } from './essay.routes.js';
import { contestRouter } from './contest.routes.js';
import { studyTaskRouter } from './study-task.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { paymentRouter } from './payment.routes.js';
import { adminRouter } from './admin.routes.js';
import { rankingRouter } from './ranking.routes.js';
import { questionSetRouter } from './question-set.routes.js';
import { gameRouter } from './game.routes.js';
import { calendarIntegrationRouter } from './calendar-integration.routes.js';
import { errorNotebookRouter } from './error-notebook.routes.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireSubscription } from '../middlewares/subscription.middleware.js';

const router: RouterType = Router();

const gate = [authMiddleware, requireSubscription];

router.use('/auth', authRouter);
router.use('/payments', paymentRouter);
router.use('/admin', adminRouter);
router.use('/subjects', subjectRouter);
router.use('/exam-boards', examBoardRouter);
router.use('/gamification', gate, gamificationRouter);
router.use('/groups', gate, groupRouter);
router.use('/questions', gate, questionRouter);
router.use('/study', gate, studyRouter);
router.use('/documents', gate, documentRouter);
router.use('/study-plans', gate, studyPlanRouter);
router.use('/flashcards', gate, flashcardRouter);
router.use('/study-kit', gate, studyKitRouter);
router.use('/essays', gate, essayRouter);
router.use('/contests', gate, contestRouter);
router.use('/study-tasks', gate, studyTaskRouter);
router.use('/calendar', calendarIntegrationRouter);
router.use('/dashboard', gate, dashboardRouter);
router.use('/rankings', gate, rankingRouter);
router.use('/question-sets', gate, questionSetRouter);
router.use('/games', gate, gameRouter);
router.use('/error-notebook', gate, errorNotebookRouter);

router.get('/health', (_req, res) => {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
});

export { router as apiRouter };
