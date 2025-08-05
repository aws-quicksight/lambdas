import vine from '@vinejs/vine';
import { type Infer } from '@vinejs/vine/types';

export const dashboardValidator = vine.compile(
  vine.object({
    action: vine.enum(['describe-dashboard', 'describe-dashboard-definition', 'describe-dashboard-permissions']),
    dashboardId: vine
      .string()
      .optional()
      .requiredWhen('action', 'in', [
        'describe-dashboard',
        'describe-dashboard-definition',
        'describe-dashboard-permissions',
      ]),
    versionNumber: vine.number().optional(),
    aliasName: vine.string().optional(),
  }),
);

export type DashboardSchema = Infer<typeof dashboardValidator>;
