import vine from '@vinejs/vine';
import { type Infer } from '@vinejs/vine/types';

export const userValidator = vine.compile(
  vine.object({
    action: vine.enum(['describe-user']),
    userName: vine.string().optional().requiredWhen('action', 'in', ['describe-user']),
    namespace: vine.string().optional().requiredWhen('action', 'in', ['describe-user']),
  }),
);

export type UserSchema = Infer<typeof userValidator>;
