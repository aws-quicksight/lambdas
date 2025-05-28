import { env } from './env.js';

export const databaseOptions = {
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: env.DB_PORT,
  charset: 'utf8mb4',
  timezone: '+00:00',
};
