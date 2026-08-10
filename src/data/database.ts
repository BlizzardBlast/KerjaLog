import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from '@/data/migrations/migrateDatabase';
import { getOrCreateDatabaseKey } from '@/platform/secure-storage/databaseKey';

const DATABASE_NAME = 'kerjalog.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabase().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const key = await getOrCreateDatabaseKey();
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  try {
    // Must happen before reading/writing any database pages.
    await db.execAsync(`PRAGMA key = "x'${key}'"`);

    // Verify that this binary actually contains SQLCipher.
    const cipher = await db.getFirstAsync<{ cipher_version: string }>(
      'PRAGMA cipher_version',
    );

    if (!cipher?.cipher_version) {
      throw new Error('SQLCipher is not available in this build.');
    }

    // Forces SQLCipher to actually try reading the database,
    // therefore detecting a wrong key.
    await db.getFirstAsync('SELECT count(*) AS count FROM sqlite_master');

    await db.execAsync('PRAGMA foreign_keys = ON');
    await db.execAsync('PRAGMA journal_mode = WAL');

    await migrateDatabase(db);

    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}
