import process from 'node:process';
import { cleanEnv, host, port, str } from 'envalid';

export const env = cleanEnv(process.env, {
  AWS_CUSTOM_KEY: str({ default: '' }),
  AWS_CUSTOM_SECRET: str({ default: '' }),
  AWS_CUSTOM_REGION: str({ default: 'us-east-1' }),
  AWS_CUSTOM_ACCOUNT_ID: str({ default: '' }),

  DB_HOST: host({ default: 'host' }),
  DB_PORT: port({ default: 3306 }),
  DB_NAME: str({ default: 'default' }),
  DB_PASSWORD: str({ default: '' }),
  DB_USER: str({ default: 'root' }),
});
