import { type Router as RouterType, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '@concurso-ai/shared';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { validate } from '../middlewares/validate.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { env } from '../config/env.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
  resetAccountSchema,
  pauseSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleCredentialSchema,
} from '../validators/auth.validators.js';

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: env.NODE_ENV === 'development' ? 500 : RATE_LIMIT.AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

const router: RouterType = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);

// Recuperação de Senha
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Autenticação com Google
router.get('/google/url', authController.googleAuthUrl);
router.get('/google/callback', authController.googleCallback);
router.post('/google/credential', authLimiter, validate(googleCredentialSchema), authController.googleCredential);

// Rotas autenticadas
router.get('/profile', authMiddleware, authController.profile);
router.patch('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);
router.patch('/password', authMiddleware, authLimiter, validate(changePasswordSchema), authController.changePassword);
router.patch('/email', authMiddleware, authLimiter, validate(changeEmailSchema), authController.changeEmail);
router.patch('/pause', authMiddleware, validate(pauseSchema), authController.setPause);
router.post('/reset-account', authMiddleware, authLimiter, validate(resetAccountSchema), authController.resetAccount);

export { router as authRouter };
