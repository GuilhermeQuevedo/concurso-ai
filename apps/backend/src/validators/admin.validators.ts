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

export type GrantAccessDTO = z.infer<typeof grantAccessSchema>['body'];
