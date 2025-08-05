import vine from '@vinejs/vine';
import { type Infer } from '@vinejs/vine/types';

export const listValidator = vine.compile(
  vine.object({
    serviceId: vine.string(),
    type: vine.enum([
      'analysis',
      'dashboards',
      'data-sets',
      'data-sources',
      'groups',
      'group-memberships',
      'users',
      'vpc-connections',
    ]),
    namespace: vine.string().optional().requiredWhen('listType', 'in', ['groups', 'group-memberships', 'users']),
    groupName: vine.string().optional().requiredWhen('listType', '=', 'group-memberships'),
  }),
);

export type ListSchema = Infer<typeof listValidator>;
