import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  dailyGoal: z.coerce.number().int().min(5).max(500).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(1),
});

export const resetAccountSchema = z.object({
  password: z.string().min(1),
});

export const pauseSchema = z.object({
  days: z.coerce.number().int().min(0).max(365),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres').max(100),
});

export const googleCredentialSchema = z.object({
  credential: z.string().min(10, 'Credencial Google inválida'),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type RefreshDTO = z.infer<typeof refreshSchema>;
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
export type ChangeEmailDTO = z.infer<typeof changeEmailSchema>;
export type ResetAccountDTO = z.infer<typeof resetAccountSchema>;
export type PauseDTO = z.infer<typeof pauseSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
export type GoogleCredentialDTO = z.infer<typeof googleCredentialSchema>;
