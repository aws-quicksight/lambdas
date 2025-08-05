import vine from '@vinejs/vine';
import { type Infer } from '@vinejs/vine/types';

export const datasetValidator = vine.compile(
  vine.object({
    action: vine.enum(['create', 'describe', 'describe-dataset-permissions', 'delete']),
    dataSetId: vine
      .string()
      .optional()
      .requiredWhen('action', 'in', ['describe', 'describe-dataset-permissions', 'delete']),
    create: vine
      .object({
        object: vine.string(),
        replace_text: vine
          .array(
            vine.object({
              find: vine.string(),
              replace: vine.string(),
            }),
          )
          .optional(),
        replace_key_value: vine
          .array(
            vine.object({
              path: vine.string(),
              value: vine.string(),
            }),
          )
          .optional(),
      })
      .optional()
      .requiredWhen('action', 'in', ['create']),
  }),
);

export type DatasetSchema = Infer<typeof datasetValidator>;
