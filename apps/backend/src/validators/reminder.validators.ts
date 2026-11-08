import { z } from 'zod';

const text = z.string().trim().min(1).max(200);
const dueDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createReminderSchema = z.object({
  body: z.object({
    text,
    dueDate: dueDate.optional(),
  }),
});

export const updateReminderSchema = z.object({
  body: z
    .object({
      text: text.optional(),
      done: z.boolean().optional(),
      dueDate: dueDate.nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, { message: 'Nada para atualizar.' }),
});

export type CreateReminderDTO = z.infer<typeof createReminderSchema>['body'];
export type UpdateReminderDTO = z.infer<typeof updateReminderSchema>['body'];
