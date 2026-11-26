import { z } from 'zod';

export const candidateRelationItemSchema = z.object({
  targetTopicId: z.string().min(1, 'targetTopicId é obrigatório'),
  type: z.enum(['PREREQUISITE', 'CONFUSED_WITH', 'CO_OCCURRING'], {
    errorMap: () => ({ message: 'Tipo deve ser PREREQUISITE, CONFUSED_WITH ou CO_OCCURRING' }),
  }),
  confidence: z.number().min(0.0).max(1.0),
  evidence: z
    .string()
    .min(20, 'A justificativa pedagógica deve ter no mínimo 20 caracteres')
    .max(500, 'A justificativa não deve ultrapassar 500 caracteres'),
  sourceRef: z
    .string()
    .min(5, 'A fonte jurídica ou doutrinária vinculada é obrigatória')
    .max(255, 'A fonte não deve ultrapassar 255 caracteres'),
});

export const generatedRelationsOutputSchema = z.object({
  relations: z.array(candidateRelationItemSchema).max(8),
});

export const generateRelationsBodySchema = z.object({
  topicId: z.string().min(1, 'topicId é obrigatório'),
  candidateTopicIds: z.array(z.string()).optional(),
});

export const rejectRelationBodySchema = z.object({
  rejectionReason: z
    .string()
    .min(3, 'O motivo da rejeição deve ter no mínimo 3 caracteres')
    .max(500, 'O motivo não deve ultrapassar 500 caracteres'),
});

export const updateDraftRelationBodySchema = z.object({
  evidence: z.string().min(20).max(500).optional(),
  sourceRef: z.string().min(5).max(255).optional(),
  type: z.enum(['PREREQUISITE', 'CONFUSED_WITH', 'CO_OCCURRING']).optional(),
});

export const listCurationRelationsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'APPROVED', 'REJECTED']).default('DRAFT'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  subjectId: z.string().optional(),
});

export type CandidateRelationItem = z.infer<typeof candidateRelationItemSchema>;
export type GeneratedRelationsOutput = z.infer<typeof generatedRelationsOutputSchema>;
export type GenerateRelationsBody = z.infer<typeof generateRelationsBodySchema>;
export type RejectRelationBody = z.infer<typeof rejectRelationBodySchema>;
export type UpdateDraftRelationBody = z.infer<typeof updateDraftRelationBodySchema>;
export type ListCurationRelationsQuery = z.infer<typeof listCurationRelationsQuerySchema>;
