import vine from '@vinejs/vine';
import { type Infer } from '@vinejs/vine/types';

export const dataSourceValidator = vine.compile(
  vine.object({
    action: vine.enum(['describe-data-source', 'describe-data-source-permissions']),
    dataSourceId: vine
      .string()
      .optional()
      .requiredWhen('action', 'in', ['describe-data-source', 'describe-data-source-permissions']),
  }),
);

export type DataSourceSchema = Infer<typeof dataSourceValidator>;
