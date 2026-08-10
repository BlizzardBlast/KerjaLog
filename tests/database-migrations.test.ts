import type { SQLiteDatabase } from 'expo-sqlite';
import { migrateDatabase } from '@/data/migrations/migrateDatabase';

function createDatabase(version: number) {
  const db = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getFirstAsync: jest.fn().mockResolvedValue({ user_version: version }),
    withTransactionAsync: jest.fn(async (operation: () => Promise<void>) => {
      await operation();
    }),
  };

  return {
    db: db as unknown as SQLiteDatabase,
    execAsync: db.execAsync,
    getFirstAsync: db.getFirstAsync,
    withTransactionAsync: db.withTransactionAsync,
  };
}

describe('migrateDatabase', () => {
  test('runs the initial schema and advances user_version on the keyed handle', async () => {
    const database = createDatabase(0);

    await migrateDatabase(database.db);

    expect(database.getFirstAsync).toHaveBeenCalledWith('PRAGMA user_version');
    expect(database.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(database.execAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('CREATE TABLE work_entries'),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      2,
      'PRAGMA user_version = 1',
    );
  });

  test('does not rerun migrations when the database is current', async () => {
    const database = createDatabase(1);

    await migrateDatabase(database.db);

    expect(database.withTransactionAsync).not.toHaveBeenCalled();
    expect(database.execAsync).not.toHaveBeenCalled();
  });

  test('does not advance user_version when the schema migration fails', async () => {
    const database = createDatabase(0);
    database.execAsync.mockRejectedValueOnce(
      new Error('schema migration failed'),
    );

    await expect(migrateDatabase(database.db)).rejects.toThrow(
      'schema migration failed',
    );

    expect(database.execAsync).toHaveBeenCalledTimes(1);
  });
});
