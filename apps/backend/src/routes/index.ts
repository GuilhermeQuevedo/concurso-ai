import { type Router as RouterType, Router } from 'express';
import type { ApiResponse } from '@concurso-ai/types';
import { authRouter } from './auth.routes.js';
import { subjectRouter } from './subject.routes.js';
import { examBoardRouter } from './exam-board.routes.js';
import { questionRouter } from './question.routes.js';

const router: RouterType = Router();

router.use('/auth', authRouter);
router.use('/subjects', subjectRouter);
router.use('/exam-boards', examBoardRouter);
router.use('/questions', questionRouter);

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
