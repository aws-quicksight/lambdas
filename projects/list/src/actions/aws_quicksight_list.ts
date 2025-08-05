import { awsQuickSightList, getConnection } from '@quicksight/database';
import { DateTime } from 'luxon';
import { databaseOptions } from '../config/database_options.js';
import { type ListSchema } from '../validators/list.js';

export const createOrUpdateAwsQuickSightList = async (
  documentId: string,
  assetId: string,
  name: string | null,
  type: ListSchema['type'],
  awsAccountId: string,
  region: string,
): Promise<void> => {
  await using connection = await getConnection(databaseOptions);
  const { db } = connection;
  try {
    const values = {
      documentId,
      assetId,
      name,
      type,
      awsAccountId,
      region,
    };

    await db
      .insert(awsQuickSightList)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          ...values,
          updatedAt: DateTime.now().toJSDate(),
        },
      });
  } catch (error) {
    console.error('Fallo al insertar en awsQuickSightList', error);
  }
};
