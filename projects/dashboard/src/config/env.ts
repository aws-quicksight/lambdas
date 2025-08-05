import process from 'node:process';
import { cleanEnv, str } from 'envalid';

export const env = cleanEnv(process.env, {
  BUCKET_NAME: str({ default: 'quicksightassets' }),
  BACKUP_BUCKET_NAME: str({ default: 'quicksightassets-backup' }),

  AWS_CUSTOM_ACCOUNT_ID: str({ default: '' }),
  AWS_CUSTOM_KEY: str({ default: '' }),
  AWS_CUSTOM_SECRET: str({ default: '' }),
  AWS_CUSTOM_REGION: str({ default: 'us-east-1' }),
});
