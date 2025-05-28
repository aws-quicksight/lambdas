import { awsQuickSightAssets, getConnection } from '@quicksight/database';
import { and, eq } from 'drizzle-orm';
import { databaseOptions } from '../config/database_options.js';

export const storeAwsQuickSightAssets = async (values: {
  assetId: string;
  name: string;
  awsAccountId: string;
  region: string;
}): Promise<void> => {
  await using connection = await getConnection(databaseOptions);
  const { db } = connection;
  try {
    await db
      .insert(awsQuickSightAssets)
      .values({
        assetId: values.assetId,
        name: values.name,
        type: 'data-set',
        awsAccountId: values.awsAccountId,
        region: values.region,
        statusDesc: 'CREATED',
      })
      .execute();
  } catch (error) {
    console.error('Failed to insert into awsQuickSightAssets', error);
  }
};

export const updateAwsQuickSightAssets = async (
  id: number,
  values: {
    assetId: string;
    name: string;
    awsAccountId: string;
    region: string;
  },
): Promise<void> => {
  await using connection = await getConnection(databaseOptions);
  const { db } = connection;
  try {
    await db
      .update(awsQuickSightAssets)
      .set({
        assetId: values.assetId,
        name: values.name,
        type: 'data-set',
        awsAccountId: values.awsAccountId,
        region: values.region,
        statusDesc: 'CREATED',
      })
      .where(eq(awsQuickSightAssets.id, id))
      .execute();
  } catch (error) {
    console.error(`Failed update to awsQuickSightAssets ${id}`, error);
  }
};

export const updateDeleteAwsQuickSightAssets = async (
  assetId: string,
  awsAccountId: string,
  region: string,
): Promise<void> => {
  await using connection = await getConnection(databaseOptions);
  const { db } = connection;
  try {
    await db
      .update(awsQuickSightAssets)
      .set({
        statusDesc: 'DELETED',
      })
      .where(
        and(
          eq(awsQuickSightAssets.assetId, assetId),
          eq(awsQuickSightAssets.awsAccountId, awsAccountId),
          eq(awsQuickSightAssets.region, region),
        ),
      )
      .execute();
  } catch (error) {
    console.error(
      `Failed to update status DELETED to awsQuickSightAssets ${assetId} ${awsAccountId} ${region}`,
      error,
    );
  }
};

export const checkAwsQuickSightAssetsExists = async (
  assetId: string,
  awsAccountId: string,
  region: string,
): Promise<number | null> => {
  await using connection = await getConnection(databaseOptions);
  const { db } = connection;
  const query = db
    .select({
      id: awsQuickSightAssets.id,
    })
    .from(awsQuickSightAssets)
    .where(
      and(
        eq(awsQuickSightAssets.assetId, assetId),
        eq(awsQuickSightAssets.awsAccountId, awsAccountId),
        eq(awsQuickSightAssets.region, region),
      ),
    );

  console.info(query.toSQL().sql);

  const result = await query.execute();

  return result.length > 0 ? result[0].id : null;
};
