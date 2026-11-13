import { z } from 'zod';

const MAX_ACCESS_DAYS = 3650;

export const grantAccessSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email().max(190),
    // Sem "days" o acesso não expira; com "days" vale a partir de agora.
    days: z.number().int().min(1).max(MAX_ACCESS_DAYS).optional(),
  }),
});

export const revokeAccessSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email().max(190),
  }),
});

export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const revealPiiSchema = z.object({
  justification: z
    .string({
      required_error: 'Justificativa de acesso a PII é obrigatória',
    })
    .trim()
    .min(10, 'A justificativa deve conter no mínimo 10 caracteres detalhando a razão do acesso aos dados pessoais'),
});

export const importContactsSchema = z
  .object({
    text: z.string({ required_error: 'Texto de contatos é obrigatório' }).min(1, 'Texto não pode ser vazio'),
    source: z.string().trim().optional(),
    legalBasis: z.enum(['CONSENT', 'LEGITIMATE_INTEREST', 'PRE_CONTRACTUAL'], {
      required_error: 'A base legal (legalBasis) é obrigatória para importação de contatos (Art. 7º LGPD).',
    }),
    consentProofNotes: z
      .string({
        required_error: 'A comprovação de origem/consentimento (consentProofNotes) é obrigatória.',
      })
      .trim()
      .min(10, 'A comprovação de consentimento deve conter no mínimo 10 caracteres descrevendo a origem dos leads.'),
    legitimateInterestAssessmentRef: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.legalBasis === 'LEGITIMATE_INTEREST') {
        return !!data.legitimateInterestAssessmentRef && data.legitimateInterestAssessmentRef.trim().length >= 5;
      }
      return true;
    },
    {
      message:
        'Para a base legal de LEGITIMATE_INTEREST, é obrigatório informar a referência do LIA (legitimateInterestAssessmentRef).',
      path: ['legitimateInterestAssessmentRef'],
    },
  );

export const contactOptOutSchema = z.object({
  email: z.string().email('E-mail inválido'),
  reason: z.string().trim().optional().default('USER_OPT_OUT'),
});

export type GrantAccessDTO = z.infer<typeof grantAccessSchema>['body'];
export type AdminPaginationDTO = z.infer<typeof adminPaginationSchema>;
export type RevealPiiDTO = z.infer<typeof revealPiiSchema>;
export type ImportContactsDTO = z.infer<typeof importContactsSchema>;
export type ContactOptOutDTO = z.infer<typeof contactOptOutSchema>;
