import { apiLogsTable, getConnection } from '@quicksight/database';
import { v4 as uuidv4 } from 'uuid';
import { databaseOptions } from '../config/database_options.js';

export const storeApiLog = async (entryBody: object, responseBody: object, action: string): Promise<string> => {
  const uuid = uuidv4();
  await using connection = await getConnection(databaseOptions);
  const { db } = connection;
  try {
    await db
      .insert(apiLogsTable)
      .values({
        id: 0,
        formName: '',
        formType: '',
        source: 'awslambda',
        class: '',
        documentid: uuid,
        timezone: '',
        browser: '',
        ip: '',
        userid: '',
        action,
        method: entryBody,
        jDoc: responseBody,
      })
      .execute();

    return uuid;
  } catch (error) {
    console.error('Failed to insert into apiLogs', error);
    throw new Error('Failed to insert into apiLogs');
  }
};
