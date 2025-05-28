import 'dotenv/config';
import process from 'node:process';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '3306'),
    user: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE ?? 'quicksight',
  },
});
