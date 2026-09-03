import { z } from 'zod';

export const submitEssaySchema = z.object({
  body: z.object({
    type: z.enum(['DISSERTATIVA', 'ESTUDO_CASO']).default('DISSERTATIVA'),
    title: z.string().min(3).max(200),
    theme: z.string().min(3).max(500),
    content: z.string().max(15000).optional(),
    // Campos específicos de estudo de caso (chegam como string no multipart)
    role: z.string().max(200).optional(),
    examBoard: z.string().max(200).optional(),
    caseStatement: z.string().max(8000).optional(),
    answerKey: z.string().max(8000).optional(),
    lineLimit: z.coerce.number().int().min(1).max(200).optional(),
  }),
});

export type SubmitEssayDTO = z.infer<typeof submitEssaySchema>['body'];
