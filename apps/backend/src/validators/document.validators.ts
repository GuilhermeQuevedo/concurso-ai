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

export const documentNameSchema = z.string().trim().min(1, 'Informe o nome do documento').max(200, 'Nome muito longo');

export const updateDocumentNameSchema = z.object({
  body: z.object({
    name: documentNameSchema,
  }),
});
