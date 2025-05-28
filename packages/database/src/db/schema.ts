import { sql } from 'drizzle-orm';
import { datetime, int, json, mysqlTable, primaryKey, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const awsQuickSightAssets = mysqlTable(
  'awsQuickSightAssets',
  {
    id: int().autoincrement().notNull(),
    assetId: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }),
    type: varchar({ length: 255 }).notNull(),
    awsAccountId: varchar({ length: 30 }).notNull(),
    region: varchar({ length: 30 }).notNull(),
    dbId: varchar({ length: 255 }),
    tag: varchar({ length: 30 }).default('(ALL)'),
    clientId: varchar({ length: 45 }),
    ingestionId: varchar({ length: 36 }),
    status: varchar({ length: 20 }),
    statusDesc: varchar({ length: 100 }),
    ingestionSizeInBytes: int(),
    ingestionTimeInSeconds: int(),
    rowsDropped: int(),
    rowsIngested: int(),
    totalRowsInDataset: int(),
    createdTime: datetime({ mode: 'string' }),
    idApiLogs: int(),
    importMode: varchar({ length: 20 }).default('SPICE'),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'awsQuickSightAssets_id' })],
);

export const apiLogsTable = mysqlTable('apiLogs', {
  id: int().primaryKey(),
  formName: varchar({
    length: 2000,
  }).notNull(),
  formType: varchar({
    length: 45,
  }),
  source: varchar({
    length: 45,
  }),
  class: varchar({
    length: 45,
  }),
  documentid: char({ length: 36 }),
  timezone: varchar({
    length: 100,
  }),
  browser: varchar({
    length: 100,
  }),
  ip: varchar({
    length: 45,
  }),
  userid: varchar({
    length: 45,
  }),
  action: varchar({
    length: 100,
  }),
  method: json(),
  jDoc: json(),
  timestamp: timestamp().default(sql`CURRENT_TIMESTAMP`),
});
