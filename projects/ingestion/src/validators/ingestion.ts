import vine from '@vinejs/vine';
import { type Infer } from '@vinejs/vine/types';

export const ingestionValidator = vine.compile(
  vine.object({
    dataSetId: vine.string(),
    action: vine.enum(['create-ingestion', 'describe-ingestion']),
    ingestionId: vine.string().optional().requiredWhen('action', 'in', ['describe-ingestion']),
  }),
);

export type IngestionSchema = Infer<typeof ingestionValidator>;
