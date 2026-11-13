import { z } from 'zod';
import { sanitizePhone } from '../utils/phone.js';

export const phoneValidator = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return undefined;
      const sanitized = sanitizePhone(trimmed);
      return sanitized ?? trimmed;
    }
    return val;
  },
  z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Telefone inválido')
    .optional()
    .nullable(),
);

import { NICKNAME_MAX, NICKNAME_MIN, NICKNAME_PATTERN } from '../utils/nickname.js';

import { NICKNAME_MAX, NICKNAME_MIN, NICKNAME_PATTERN } from '../utils/nickname.js';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: phoneValidator,
  password: z.string().min(8).max(100),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'É obrigatório aceitar os Termos de Uso.',
    })
    .optional()
    .default(true),
  acceptPrivacy: z
    .boolean()
    .refine((val) => val === true, {
      message: 'É obrigatório aceitar a Política de Privacidade.',
    })
    .optional()
    .default(true),
  acceptAgeOrGuardian: z
    .boolean()
    .refine((val) => val === true, {
      message:
        'É obrigatório declarar que é maior de 18 anos ou possui autorização do responsável legal (PENDENTE DE REVISÃO JURÍDICA).',
    })
    .optional()
    .default(true),
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
  phone: phoneValidator,
  nickname: z
    .string()
    .trim()
    .min(NICKNAME_MIN, `O nickname precisa ter pelo menos ${NICKNAME_MIN} caracteres.`)
    .max(NICKNAME_MAX, `O nickname pode ter no máximo ${NICKNAME_MAX} caracteres.`)
    .regex(NICKNAME_PATTERN, 'Use apenas letras, números e _, começando por uma letra.')
    .optional(),
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

export const erasureAccountSchema = z.object({
  password: z.string().optional(),
  reason: z.string().max(500, 'Motivo deve ter no máximo 500 caracteres').optional(),
});

export const recordConsentSchema = z.object({
  documentType: z.enum(['TERMS', 'PRIVACY']),
  version: z.string().min(1, 'Versão do documento é obrigatória').max(20),
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
export type ErasureAccountDTO = z.infer<typeof erasureAccountSchema>;
export type RecordConsentDTO = z.infer<typeof recordConsentSchema>;
