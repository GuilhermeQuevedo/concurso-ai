import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    planType: z.enum(['monthly', 'semestral', 'semiannual', 'yearly', 'default']).optional(),
    priceId: z.string().optional(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
});

export type CreateCheckoutSessionDTO = z.infer<typeof createCheckoutSessionSchema>['body'];
