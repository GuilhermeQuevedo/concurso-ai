import { type Router as RouterType, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '@concurso-ai/shared';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { validate } from '../middlewares/validate.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
} from '../validators/auth.validators.js';

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

const router: RouterType = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);
router.get('/profile', authMiddleware, authController.profile);
router.patch('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);
router.patch('/password', authMiddleware, authLimiter, validate(changePasswordSchema), authController.changePassword);
router.patch('/email', authMiddleware, authLimiter, validate(changeEmailSchema), authController.changeEmail);

export { router as authRouter };
