/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { drizzle } from 'drizzle-orm/mysql2';
import { type ConnectionOptions, createConnection } from 'mysql2/promise';

export * from './db/schema.js';

export const getConnection = async (config: ConnectionOptions) => {
  const client = await createConnection(config);

  const db = drizzle({
    client,
  });

  return {
    db,
    [Symbol.asyncDispose]: async () => {
      await client.end();
    },
  };
};
