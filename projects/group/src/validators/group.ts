import vine from '@vinejs/vine';
import { type Infer } from '@vinejs/vine/types';

export const groupValidator = vine.compile(
  vine.object({
    action: vine.enum(['describe-group', 'describe-group-membership']),
    groupName: vine.string().optional().requiredWhen('action', 'in', ['describe-group', 'describe-group-membership']),
    namespace: vine.string().optional().requiredWhen('action', 'in', ['describe-group', 'describe-group-membership']),
    memberName: vine.string().optional().requiredWhen('action', 'in', ['describe-group-membership']),
  }),
);

export type GroupSchema = Infer<typeof groupValidator>;
