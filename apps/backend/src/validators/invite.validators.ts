import { z } from 'zod';

import { NICKNAME_MIN } from '../utils/nickname.js';

const INVITE_IDENTIFIER_MAX = 20;

export const inviteByNicknameSchema = z.object({
  body: z
    .object({
      // Aceita "@nick" digitado por costume e o código de amigo.
      nickname: z
        .string()
        .trim()
        .transform((value) => value.replace(/^@/, ''))
        .pipe(z.string().min(NICKNAME_MIN).max(INVITE_IDENTIFIER_MAX))
        .optional(),
      friendUserId: z.string().min(1).max(40).optional(),
    })
    .refine((body) => Boolean(body.nickname) !== Boolean(body.friendUserId), {
      message: 'Informe o nickname/código ou escolha um amigo.',
    }),
});
