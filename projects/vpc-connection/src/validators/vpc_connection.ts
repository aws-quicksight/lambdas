import vine from '@vinejs/vine';
import { type Infer } from '@vinejs/vine/types';

export const vpcConnectionValidator = vine.compile(
  vine.object({
    action: vine.enum(['describe-vpc-connection']),
    vpcConnectionId: vine.string().optional().requiredWhen('action', 'in', ['describe-vpc-connection']),
  }),
);

export type VpcConnectionSchema = Infer<typeof vpcConnectionValidator>;
