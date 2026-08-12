import type { SQLiteDatabase } from 'expo-sqlite';

let databaseAccessQueue: Promise<void> = Promise.resolve();

/**
 * Serializes all application access to the keyed SQLCipher connection.
 *
 * Expo's non-exclusive transaction API can include queries that execute on the
 * same connection while a transaction is open. KerjaLog intentionally uses one
 * already-keyed connection, so reads and writes share this scheduler rather than
 * allowing an unrelated read to participate in another operation's transaction.
 */
export async function withKeyedDatabaseAccess<T>(
  task: () => Promise<T>,
): Promise<T> {
  const waitForPrevious = databaseAccessQueue;
  let releaseCurrent: () => void = () => undefined;

  databaseAccessQueue = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });

  await waitForPrevious;

  try {
    return await task();
  } finally {
    releaseCurrent();
  }
}

/**
 * Runs a transaction on the exact database handle that has already been keyed.
 *
 * Expo SDK 57's withExclusiveTransactionAsync opens a second native connection.
 * SQLCipher keys are connection-local, so that second connection would be
 * unkeyed and fail as soon as it touches the encrypted database.
 */
export async function withKeyedTransaction<T>(
  db: SQLiteDatabase,
  task: (db: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  return withKeyedDatabaseAccess(async () => {
    let result: T | undefined;

    await db.withTransactionAsync(async () => {
      result = await task(db);
    });

    return result as T;
  });
}
