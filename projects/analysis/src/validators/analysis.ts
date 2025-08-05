import vine from '@vinejs/vine';
import { type Infer } from '@vinejs/vine/types';

export const analysisValidator = vine.compile(
  vine.object({
    action: vine.enum(['describe-analysis', 'describe-analysis-definition', 'create-analysis', 'delete-analysis']),
    analysisId: vine
      .string()
      .optional()
      .requiredWhen('action', 'in', ['describe-analysis', 'describe-analysis-definition', 'delete-analysis']),
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
      .requiredWhen('action', 'in', ['create-analysis']),
  }),
);

export type AnalysisSchema = Infer<typeof analysisValidator>;
