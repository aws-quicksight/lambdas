import { getConnection } from '@quicksight/database';
import { sql } from 'drizzle-orm';
import { databaseOptions } from '../config/database_options.js';

export const executeSP = async (uuid: string, action: string): Promise<void> => {
  await using connection = await getConnection(databaseOptions);
  const { db } = connection;
  try {
    const query = sql`CALL spApiLogs(${uuid}, ${action})`;
    const result = await db.execute(query);
    console.info(result);
  } catch (error) {
    console.error('Error ejecutando el SP', error);
    throw new Error('Error ejecutando el SP');
  }
};
