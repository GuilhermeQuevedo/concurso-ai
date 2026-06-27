import { type Router as RouterType, Router } from 'express';
import type { ApiResponse } from '@concurso-ai/types';

const router: RouterType = Router();

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
