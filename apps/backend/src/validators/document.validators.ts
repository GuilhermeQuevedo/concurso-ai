import { z } from 'zod';

const documentKindSchema = z.enum([
  'EDITAL',
  'EMENTA',
  'CRONOGRAMA',
  'MATERIAL',
  'LISTA_QUESTOES',
  'OUTRO',
]);

export const documentParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const documentQuerySchema = z.object({
  subjectId: z.string().min(1).optional(),
});

export const updateDocumentKindSchema = z.object({
  body: z.object({
    kind: documentKindSchema,
  }),
});
