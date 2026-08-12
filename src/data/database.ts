import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from '@/data/migrations/migrateDatabase';
import { assertEncryptedStorageRuntimeSupported } from '@/platform/runtime/encryptedStorageRuntime';
import {
  generateDatabaseKey,
  getStoredDatabaseKey,
  storeDatabaseKey,
} from '@/platform/secure-storage/databaseKey';

// This filename intentionally differs from the earlier development database.
// Before SQLCipher was enabled, a plaintext kerjalog.db could have been created
// on a device. Opening that file as an encrypted database produces SQLITE_NOTADB.
const DATABASE_NAME = 'kerjalog-encrypted-v1.db';

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
  assertEncryptedStorageRuntimeSupported();

  const storedKey = await getStoredDatabaseKey();
  const key = storedKey ?? (await generateDatabaseKey());
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME, {
    // Expo caches same-name native connections for Fast Refresh by default.
    // SQLCipher must key each newly opened handle before any database page is
    // accessed, so keep this connection isolated from a stale native handle.
    useNewConnection: true,
  });
  let deleteDatabaseIfKeyPersistenceFails = false;

  try {
    // Expo documents passphrase keying immediately after open. The value is a
    // locally generated 256-bit hexadecimal secret, so it contains no SQL
    // quoting characters and is never derived from user input.
    await db.execAsync(`PRAGMA key = '${key}'`);

    const cipher = await db.getFirstAsync<{ cipher_version: string }>(
      'PRAGMA cipher_version',
    );

    if (!cipher?.cipher_version) {
      throw new Error('SQLCipher is not available in this build.');
    }

    // Force SQLCipher to authenticate/decrypt the first database page before
    // migrations or application queries run. If SecureStore no longer has a
    // key but an encrypted database already exists, a newly generated key will
    // fail here and must never replace the missing original key.
    try {
      await db.getFirstAsync('SELECT count(*) AS count FROM sqlite_master');
    } catch (error) {
      if (storedKey === null) {
        throw new Error(
          'An existing encrypted KerjaLog database cannot be opened because its device-bound encryption key is unavailable.',
        );
      }

      throw error;
    }

    if (storedKey === null) {
      // The generated key has now proven it can open this database, which means
      // this is a new/empty database rather than an encrypted restore whose key
      // is missing. Persist the key before any schema or user data is written.
      deleteDatabaseIfKeyPersistenceFails = true;
      await storeDatabaseKey(key);
      deleteDatabaseIfKeyPersistenceFails = false;
    }

    await db.execAsync('PRAGMA foreign_keys = ON');
    await db.execAsync('PRAGMA journal_mode = WAL');

    await migrateDatabase(db);

    return db;
  } catch (error) {
    await db.closeAsync().catch(() => undefined);

    if (deleteDatabaseIfKeyPersistenceFails) {
      await SQLite.deleteDatabaseAsync(DATABASE_NAME).catch(() => undefined);
    }

    throw error;
  }
}
