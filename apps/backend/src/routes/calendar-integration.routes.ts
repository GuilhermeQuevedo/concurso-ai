import { type Router as RouterType, Router } from 'express';
import { CalendarIntegrationController } from '../controllers/calendar-integration.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.js';
import {
  updateCalendarIntegrationSchema,
  googleAuthCallbackSchema,
} from '../validators/calendar-integration.validators.js';

const router: RouterType = Router();
const controller = new CalendarIntegrationController();

// Public subscription feed (Google Calendar / Apple Calendar / Outlook fetch via token)
router.get('/feed/:token', controller.getFeed);

// Protected integration endpoints
router.get('/integration', authMiddleware, controller.getIntegration);
router.patch(
  '/integration',
  authMiddleware,
  validateRequest(updateCalendarIntegrationSchema),
  controller.updateSettings,
);
router.post('/integration/regenerate-token', authMiddleware, controller.regenerateToken);

// Google OAuth direct integration
router.get('/google/auth-url', authMiddleware, controller.getGoogleAuthUrl);
router.post(
  '/google/callback',
  authMiddleware,
  validateRequest(googleAuthCallbackSchema),
  controller.handleGoogleCallback,
);
router.post('/google/sync', authMiddleware, controller.syncToGoogle);
router.delete('/google/disconnect', authMiddleware, controller.disconnectGoogle);

export { router as calendarIntegrationRouter };
