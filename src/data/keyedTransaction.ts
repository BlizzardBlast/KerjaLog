import type { SQLiteDatabase } from 'expo-sqlite';

let transactionQueue: Promise<void> = Promise.resolve();

/**
 * Runs a transaction on the exact database handle that has already been keyed.
 *
 * Expo SDK 57's withExclusiveTransactionAsync opens a second native connection.
 * SQLCipher keys are connection-local, so that second connection would be
 * unkeyed and fail as soon as it touches the encrypted database. Keep encrypted
 * transactions on the original handle and serialize them here instead.
 */
export async function withKeyedTransaction<T>(
  db: SQLiteDatabase,
  task: (db: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const waitForPrevious = transactionQueue;
  let releaseCurrent: () => void = () => undefined;

  transactionQueue = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });

  await waitForPrevious;

  try {
    let result: T | undefined;

    await db.withTransactionAsync(async () => {
      result = await task(db);
    });

    return result as T;
  } finally {
    releaseCurrent();
  }
}
