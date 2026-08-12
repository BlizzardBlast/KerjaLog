import type { SQLiteDatabase } from 'expo-sqlite';
import { withKeyedTransaction } from '@/data/keyedDatabaseAccess';
import { migrateToVersion1 } from '@/data/migrations/001-initial';
import { migrateToVersion2 } from '@/data/migrations/002-harden-entry-constraints';
import { migrateToVersion3 } from '@/data/migrations/003-active-work-entry-draft';

const DATABASE_VERSION = 3;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );

  let version = result?.user_version ?? 0;

  if (version > DATABASE_VERSION) {
    throw new Error(
      `Database schema version ${version} is newer than supported version ${DATABASE_VERSION}.`,
    );
  }

  if (version === DATABASE_VERSION) {
    return;
  }

  await withKeyedTransaction(db, async (transaction) => {
    if (version < 1) {
      await migrateToVersion1(transaction);
      version = 1;
    }

    if (version < 2) {
      await migrateToVersion2(transaction);
      version = 2;
    }

    if (version < 3) {
      await migrateToVersion3(transaction);
      version = 3;
    }

    await transaction.execAsync(`PRAGMA user_version = ${version}`);
  });
}
