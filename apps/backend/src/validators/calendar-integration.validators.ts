import { z } from 'zod';

export const updateCalendarIntegrationSchema = z.object({
  body: z.object({
    syncTasks: z.boolean().optional(),
    syncExams: z.boolean().optional(),
    defaultTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora deve ser HH:mm')
      .optional(),
  }),
});

export const googleAuthCallbackSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Código de autorização é obrigatório'),
  }),
});

export type UpdateCalendarIntegrationDTO = z.infer<typeof updateCalendarIntegrationSchema>['body'];
export type GoogleAuthCallbackDTO = z.infer<typeof googleAuthCallbackSchema>['body'];
