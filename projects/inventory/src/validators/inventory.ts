import vine from '@vinejs/vine';
import { type Infer } from '@vinejs/vine/types';

export const inventoryValidator = vine.compile(
  vine.object({
    serviceId: vine.string(),
    action: vine.enum(['list', 'describe']),
    listType: vine
      .enum([
        'analyses',
        'dashboards',
        'data-sets',
        'data-sources',
        'groups',
        'group-memberships',
        'users',
        'vpc-connections',
      ])
      .optional()
      .requiredWhen('action', '=', 'list'),
    namespace: vine.string().optional().requiredWhen('listType', 'in', ['groups', 'group-memberships', 'users']),
    groupName: vine.string().optional().requiredWhen('listType', '=', 'group-memberships'),
    describeType: vine
      .enum([
        'analysis',
        'analysis-definition',
        'analysis-permissions',
        'dashboard',
        'dashboard-definition',
        'dashboard-permissions',
        'data-set',
        'data-set-permissions',
        'data-source',
        'data-source-permissions',
        'group',
        'group-membership',
        'user',
        'vpc-connection',
      ])
      .optional()
      .requiredWhen('action', '=', 'describe'),
  }),
);

export type InventorySchema = Infer<typeof inventoryValidator>;
