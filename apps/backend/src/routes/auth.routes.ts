import { type Router as RouterType, Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { validate } from '../middlewares/validate.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rate-limit.middleware.js';
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

const router: RouterType = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);

// Recuperação de Senha
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Autenticação com Google
router.get('/google/url', authController.googleAuthUrl);
router.get('/google/callback', authController.googleCallback);
router.post('/google/credential', authRateLimiter, validate(googleCredentialSchema), authController.googleCredential);

// Rotas autenticadas
router.get('/profile', authMiddleware, authController.profile);
router.patch('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);
router.patch('/password', authMiddleware, authRateLimiter, validate(changePasswordSchema), authController.changePassword);
router.patch('/email', authMiddleware, authRateLimiter, validate(changeEmailSchema), authController.changeEmail);
router.patch('/pause', authMiddleware, validate(pauseSchema), authController.setPause);
router.post('/reset-account', authMiddleware, authRateLimiter, validate(resetAccountSchema), authController.resetAccount);

export { router as authRouter };
