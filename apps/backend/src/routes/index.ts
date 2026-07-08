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
import { gamificationRouter } from './gamification.routes.js';
import { groupRouter } from './group.routes.js';
import { essayRouter } from './essay.routes.js';
import { contestRouter } from './contest.routes.js';
import { studyTaskRouter } from './study-task.routes.js';

const router: RouterType = Router();

router.use('/auth', authRouter);
router.use('/subjects', subjectRouter);
router.use('/exam-boards', examBoardRouter);
router.use('/questions', questionRouter);
router.use('/study', studyRouter);
router.use('/documents', documentRouter);
router.use('/study-plans', studyPlanRouter);
router.use('/flashcards', flashcardRouter);
router.use('/gamification', gamificationRouter);
router.use('/groups', groupRouter);
router.use('/essays', essayRouter);
router.use('/contests', contestRouter);
router.use('/study-tasks', studyTaskRouter);

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
