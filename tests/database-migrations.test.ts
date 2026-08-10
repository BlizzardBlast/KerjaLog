import type { SQLiteDatabase } from 'expo-sqlite';
import { migrateDatabase } from '@/data/migrations/migrateDatabase';

function createDatabase(version: number) {
  const transaction = {
    execAsync: jest.fn().mockResolvedValue(undefined),
  };
  const db = {
    getFirstAsync: jest.fn().mockResolvedValue({ user_version: version }),
    withExclusiveTransactionAsync: jest.fn(
      async (operation: (transaction: SQLiteDatabase) => Promise<void>) => {
        await operation(transaction as unknown as SQLiteDatabase);
      },
    ),
  };

  return {
    db: db as unknown as SQLiteDatabase,
    getFirstAsync: db.getFirstAsync,
    withExclusiveTransactionAsync: db.withExclusiveTransactionAsync,
    transaction,
  };
}

describe('migrateDatabase', () => {
  test('runs the initial schema and advances user_version atomically', async () => {
    const database = createDatabase(0);

    await migrateDatabase(database.db);

    expect(database.getFirstAsync).toHaveBeenCalledWith('PRAGMA user_version');
    expect(database.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(database.transaction.execAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('CREATE TABLE work_entries'),
    );
    expect(database.transaction.execAsync).toHaveBeenNthCalledWith(
      2,
      'PRAGMA user_version = 1',
    );
  });

  test('does not rerun migrations when the database is current', async () => {
    const database = createDatabase(1);

    await migrateDatabase(database.db);

    expect(database.withExclusiveTransactionAsync).not.toHaveBeenCalled();
    expect(database.transaction.execAsync).not.toHaveBeenCalled();
  });

  test('does not advance user_version when the schema migration fails', async () => {
    const database = createDatabase(0);
    database.transaction.execAsync.mockRejectedValueOnce(
      new Error('schema migration failed'),
    );

    await expect(migrateDatabase(database.db)).rejects.toThrow(
      'schema migration failed',
    );

    expect(database.transaction.execAsync).toHaveBeenCalledTimes(1);
  });
});
